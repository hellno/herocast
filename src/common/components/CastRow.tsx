import React, { useState } from 'react';
import { toBytes } from 'viem'

import { castTextStyle, classNames } from "@/common/helpers/css";
import { CastType, CastReactionType } from "@/common/constants/farcaster";
import { ChannelType } from "@/common/constants/channels";
import { useAccountStore } from "@/stores/useAccountStore";
import { ArrowPathRoundedSquareIcon, ArrowTopRightOnSquareIcon, ChatBubbleLeftIcon, HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartFilledIcon } from "@heroicons/react/24/solid";
import { ImgurImage } from "@/common/components/PostEmbeddedContent";
import { localize, timeDiff } from "../helpers/date";
import { publishReaction, removeReaction } from '../helpers/farcaster';
import { ReactionType } from '@farcaster/hub-web';
import includes from 'lodash.includes';
import map from 'lodash.map';
import { useHotkeys } from 'react-hotkeys-hook';
import * as Tooltip from '@radix-ui/react-tooltip';
import HotkeyTooltipWrapper from './HotkeyTooltipWrapper';
import get from 'lodash.get';

interface CastRowProps {
  cast: CastType;
  showChannel: boolean;
  channels: ChannelType[];
  onSelect?: () => void;
  isSelected?: boolean;
  showEmbed?: boolean;
  isThreadView?: boolean;
}

export const CastRow = ({ cast, isSelected, showChannel, onSelect, channels, showEmbed, isThreadView = false }: CastRowProps) => {
  // if (isSelected) console.log(cast);

  const { accounts, selectedAccountIdx } = useAccountStore();
  const [didLike, setDidLike] = useState(false)
  const [didRecast, setDidRecast] = useState(false)

  const selectedAccount = accounts[selectedAccountIdx];
  const userFid = Number(selectedAccount.platformAccountId);
  const authorFid = cast.author.fid;

  const embedUrl = cast.embeds.length > 0 ? cast.embeds[0].url : null;
  const isImageUrl = embedUrl ? embedUrl.endsWith('.gif') || embedUrl.endsWith('.png') || embedUrl.endsWith('.jpg') : false;
  const embedImageUrl = isImageUrl ? embedUrl : null;
  const now = new Date();

  const getCastReactionsObj = () => {
    const repliesCount = cast.replies?.count || 0;
    const recastsCount = cast.reactions?.recasts?.length || cast.recasts?.count || 0;
    const likesCount = cast.reactions?.likes?.length || cast.reactions?.count || 0;

    const likeFids = cast.reactions?.fids || map(cast.reactions.likes, 'fid') || [];
    const recastFids = cast.recasts?.fids || map(cast.reactions.recasts, 'fid') || [];
    return {
      [CastReactionType.replies]: { count: repliesCount },
      [CastReactionType.recasts]: { count: recastsCount + Number(didRecast), isActive: didRecast || includes(recastFids, userFid) },
      [CastReactionType.likes]: { count: likesCount + Number(didLike), isActive: didLike || includes(likeFids, userFid) },
    }
  }
  const reactions = getCastReactionsObj();

  useHotkeys('l', () => {
    if (isSelected) {
      onClickReaction(CastReactionType.likes, reactions[CastReactionType.likes].isActive)
    }
  }, { enabled: isSelected }, [isSelected, selectedAccountIdx, authorFid, cast.hash, reactions.likes]);

  useHotkeys('r', () => {
    if (isSelected) {
      onClickReaction(CastReactionType.recasts, reactions[CastReactionType.recasts].isActive)
    }
  }, { enabled: isSelected }, [isSelected, selectedAccountIdx, authorFid, cast.hash, reactions.recasts]);

  const getChannelForParentUrl = (parentUrl: string | null): ChannelType | undefined => parentUrl ?
    channels.find((channel) => channel.parent_url === parentUrl) : undefined;

  const getIconForCastReactionType = (reactionType: CastReactionType, isActive?: boolean): JSX.Element | undefined => {
    const className = classNames(isActive ? "text-gray-300" : "", "mt-0.5 w-4 h-4 mr-1");

    switch (reactionType) {
      case CastReactionType.likes:
        return isActive ? <HeartFilledIcon className={className} aria-hidden="true" /> : <HeartIcon className={className} aria-hidden="true" />
      case CastReactionType.recasts:
        return <ArrowPathRoundedSquareIcon className={className} aria-hidden="true" />
      case CastReactionType.replies:
        return <ChatBubbleLeftIcon className={className} aria-hidden="true" />
      case CastReactionType.links:
        return <ArrowTopRightOnSquareIcon className={className} aria-hidden="true" />
      default:
        return undefined;
    }
  }

  const onClickReaction = async (key: CastReactionType, isActive: boolean) => {
    if (key !== CastReactionType.recasts && key !== CastReactionType.likes) {
      return;
    }

    try {
      const reactionBodyType = key === 'likes' ? ReactionType.LIKE : ReactionType.RECAST;
      const reactionBody = { type: reactionBodyType, targetCastId: { fid: Number(authorFid), hash: toBytes(cast.hash) } }
      if (isActive) {
        await removeReaction({ authorFid: userFid, privateKey: selectedAccount.privateKey, reactionBody });
      } else {
        await publishReaction({ authorFid: userFid, privateKey: selectedAccount.privateKey, reactionBody });
      }
    } catch (error) {
      console.error(`Error in onClickReaction: ${error}`);
    }

    if (key === CastReactionType.likes) {
      setDidLike(!isActive)
    } else {
      setDidRecast(!isActive)
    }
  }

  const renderReaction = (key: CastReactionType, isActive: boolean, count?: number | string, icon?: JSX.Element) => {
    return (<div key={`cast-${cast.hash}-${key}`} className="mt-1.5 flex align-center text-sm text-gray-400 hover:text-gray-300 hover:bg-gray-500 py-1 px-1.5 rounded-md"
      onClick={async (event) => {
        event.stopPropagation()
        onClickReaction(key, isActive);
      }}>
      {icon}
      {count !== null && <span className="">{count}</span>}
    </div>)
  }


  const renderCastReactions = (cast: CastType) => {
    const linksCount = cast.embeds.length;
    const isOnchainLink = linksCount ? cast.embeds[0].url.startsWith('"chain:') : false;

    return (<div className="-ml-1.5 flex space-x-3">
      {Object.entries(reactions).map(([key, reactionInfo]) => {
        const isActive = get(reactionInfo, 'isActive', false);
        const icon = getIconForCastReactionType(key as CastReactionType, isActive);
        const reaction = renderReaction(key as CastReactionType, isActive, reactionInfo.count, icon);

        if (key === 'likes' && isSelected) {
          return <Tooltip.Provider key={`cast-${cast.hash}-${key}-${reaction}`} delayDuration={50} skipDelayDuration={0}>
            <HotkeyTooltipWrapper hotkey="L" side="bottom">
              {reaction}
            </HotkeyTooltipWrapper>
          </Tooltip.Provider>
        } else if (key === 'recasts' && isSelected) {
          return <Tooltip.Provider key={`cast-${cast.hash}-${key}-${reaction}`} delayDuration={50} skipDelayDuration={0}>
            <HotkeyTooltipWrapper hotkey="R" side="bottom">
              {reaction}
            </HotkeyTooltipWrapper>
          </Tooltip.Provider>
        } else {
          return reaction;
        }

      })}
      {linksCount && !isOnchainLink ? (
        <a href={cast.embeds[0].url} target="_blank" rel="noreferrer" className="cursor-pointer">
          {renderReaction(CastReactionType.links, linksCount > 1 ? linksCount : undefined, getIconForCastReactionType(CastReactionType.links))}
        </a>) : null
      }
    </div>)
  }
  const channel = showChannel ? getChannelForParentUrl(cast.parent_url) : null;

  const authorPfpUrl = cast.author.pfp_url || cast.author.pfp?.url;
  const timeAgo = timeDiff(now, new Date(cast.timestamp))
  const timeAgoStr = localize(timeAgo[0], timeAgo[1]);

  return (<div className="flex grow">
    <div
      onClick={() => onSelect && onSelect()}
      className={classNames(
        isSelected ? "bg-gray-900/20" : "hover:bg-gray-900/30",
        isThreadView ? "" : (isSelected ? "border-l-2 border-gray-100/80" : "border-l-2 border-transparent"),
        "px-5 py-4 grow rounded-r-sm cursor-pointer"
      )}>
      <div className="flex items-top gap-x-4">
        {!isThreadView && (
          <img
            src={`https://res.cloudinary.com/merkle-manufactory/image/fetch/c_fill,f_png,w_144/${authorPfpUrl}`}
            alt=""
            className="relative h-10 w-10 flex-none rounded-full bg-gray-50"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="flex flex-col w-full">
          <div className="flex flex-row justify-between gap-x-4 leading-5 text-gray-300">
            <div className="flex flex-row">
              <span className="flex font-semibold text-gray-300 truncate">@{cast.author.username} <span className="hidden md:ml-1 md:block">({cast.author.display_name || cast.author.displayName})</span></span>
              {showChannel && channel && (
                <span className="h-5 ml-2 inline-flex items-top rounded-sm bg-blue-400/10 px-1.5 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-400/30">
                  {channel.name}
                </span>
              )}
            </div>
            {cast.timestamp && (
              <div className="flex flex-row">
                <span className="text-sm leading-5 text-gray-300">
                  {timeAgoStr}
                </span>
              </div>
            )}
          </div>
          <div className={classNames(isThreadView ? "ml-0.5" : "")}>
            <p className="mt-2 w-full max-w-lg xl:max-w-2xl text-md text-gray-100 break-words lg:break-normal" style={castTextStyle}>
              {cast.text}
            </p>
            {embedImageUrl && <ImgurImage url={embedImageUrl} />}
          </div>
          {renderCastReactions(cast)}
        </div>
      </div>
    </div>
  </div>)
}
