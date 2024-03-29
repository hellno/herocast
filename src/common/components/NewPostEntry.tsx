import React, { useEffect } from "react";
import { useNewPostStore } from "@/stores/useNewPostStore";
import { useAccountStore } from "@/stores/useAccountStore";
import { DraftType } from "../constants/farcaster";
import { useHotkeys } from "react-hotkeys-hook";
import { useEditor, EditorContent } from "@mod-protocol/react-editor";
import { EmbedsEditor } from "@mod-protocol/react-ui-shadcn/dist/lib/embeds";
import {
  Embed,
  ModManifest,
  fetchUrlMetadata,
  handleAddEmbed,
  handleOpenFile,
  handleSetInput,
} from "@mod-protocol/core";
import {
  Channel,
  getFarcasterChannels,
  getFarcasterMentions,
} from "@mod-protocol/farcaster";
import { createRenderMentionsSuggestionConfig } from "@mod-protocol/react-ui-shadcn/dist/lib/mentions";
import { CastLengthUIIndicator } from "@mod-protocol/react-ui-shadcn/dist/components/cast-length-ui-indicator";
import debounce from "lodash.debounce";
import { Button } from "@/components/ui/button";
import { MentionList } from "@mod-protocol/react-ui-shadcn/dist/components/mention-list";
import { ChannelList } from "@mod-protocol/react-ui-shadcn/dist/components/channel-list";
import { take } from "lodash";
import { ChannelPicker } from "./ChannelPicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CreationMod, RichEmbed } from "@mod-protocol/react";
import {
  creationMods,
  defaultRichEmbedMod,
  creationModsExperimental,
} from "@mod-protocol/mod-registry";
import { ModsSearch } from "@mod-protocol/react-ui-shadcn/dist/components/creation-mods-search";
import { renderers } from "@mod-protocol/react-ui-shadcn/dist/renderers";
import map from "lodash.map";
import { renderEmbedForUrl } from "./Embeds";
import ImgurUpload from "@mods/imgur-upload";
import { PhotoIcon } from "@heroicons/react/20/solid";

const API_URL = process.env.NEXT_PUBLIC_MOD_PROTOCOL_API_URL!;
const getMentions = getFarcasterMentions(API_URL);
const debouncedGetMentions = debounce(getMentions, 200, {
  leading: true,
  trailing: false,
});
const getModChannels = getFarcasterChannels(API_URL);
const debouncedGetModChannels = debounce(getModChannels, 200, {
  leading: true,
  trailing: true,
});
const getUrlMetadata = fetchUrlMetadata(API_URL);

const onError = (err) => {
  console.error(err);
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "development") {
    window.alert(err.message);
  }
};

type NewPostEntryProps = {
  draft?: DraftType;
  draftIdx: number;
  onPost?: () => void;
  hideChannel?: boolean;
  disableAutofocus?: boolean;
};

export default function NewPostEntry({
  draft,
  draftIdx,
  onPost,
  hideChannel,
}: NewPostEntryProps) {
  const { updatePostDraft, publishPostDraft } = useNewPostStore();
  const [currentMod, setCurrentMod] = React.useState<ModManifest | null>(null);
  const hasEmbeds = draft?.embeds && draft.embeds.length > 0;

  const getChannels = async (query: string): Promise<Channel[]> => {
    const modChannels =
      query && query.length > 2
        ? await debouncedGetModChannels(query, true)
        : [];
    return take(modChannels, 10);
  };

  const account = useAccountStore(
    (state) => state.accounts[state.selectedAccountIdx]
  );
  const isReply = draft?.parentCastId !== undefined;

  const onChange = (cast: DraftType) => {
    updatePostDraft(draftIdx, cast);
  };

  const onSubmitPost = async (): Promise<boolean> => {
    if (draft?.text && draft.text.length > 0) {
      await new Promise(() => publishPostDraft(draftIdx, account, onPost));
      return true;
    }
    return false;
  };

  const ref = useHotkeys("meta+enter", onSubmitPost, [draft, account], {
    enableOnFormTags: true,
  });

  if (!draft) return null;

  const {
    editor,
    getText,
    addEmbed,
    getEmbeds,
    setEmbeds,
    setChannel,
    getChannel,
    handleSubmit,
    setText,
  } = useEditor({
    fetchUrlMetadata: getUrlMetadata,
    onError,
    onSubmit: onSubmitPost,
    linkClassName: "text-blue-300",
    renderChannelsSuggestionConfig: createRenderMentionsSuggestionConfig({
      getResults: getChannels,
      RenderList: ChannelList,
    }),
    renderMentionsSuggestionConfig: createRenderMentionsSuggestionConfig({
      getResults: debouncedGetMentions,
      RenderList: MentionList,
    }),
  });

  const text = getText();
  const embeds = getEmbeds();
  const channel = getChannel();

  useEffect(() => {
    onChange({
      ...draft,
      text,
      embeds,
      parentUrl: channel?.parent_url || undefined,
    });
  }, [text, embeds, channel]);

  useEffect(() => {
    if (draft.text !== text) {
      setText(draft.text);
    }
  }, [draft.text, draftIdx]);

  return (
    <div
      className="flex flex-col items-start min-w-full w-full h-full"
      ref={ref}
      tabIndex={-1}
    >
      <form onSubmit={handleSubmit} className="w-full">
        <div className="p-2 border-slate-200 rounded-md border">
          <EditorContent
            editor={editor}
            autoFocus
            className="w-full h-full min-h-[150px] text-foreground/80"
          />
          <EmbedsEditor
            embeds={[]}
            setEmbeds={setEmbeds}
            RichEmbed={() => <div />}
          />
        </div>
        <div className="flex flex-row pt-2 gap-1">
          {!isReply && !hideChannel && (
            <div className="text-foreground/80">
              <ChannelPicker
                getChannels={getModChannels}
                onSelect={setChannel}
                value={getChannel()}
              />
            </div>
          )}
          <Popover
            open={!!currentMod}
            onOpenChange={(op: boolean) => {
              if (!op) setCurrentMod(null);
            }}
          >
            <PopoverTrigger></PopoverTrigger>
            {/* <ModsSearch mods={creationMods} onSelect={setCurrentMod} /> */}
            <PopoverContent className="w-[400px]" align="start">
              <div className="space-y-4">
                <h4 className="font-medium leading-none">{currentMod?.name}</h4>
                <hr />
                <CreationMod
                  input={getText()}
                  embeds={getEmbeds()}
                  api={API_URL}
                  // user={user}
                  variant="creation"
                  manifest={currentMod}
                  renderers={renderers}
                  onOpenFileAction={handleOpenFile}
                  onExitAction={() => setCurrentMod(null)}
                  onSetInputAction={handleSetInput(setText)}
                  onAddEmbedAction={handleAddEmbed(addEmbed)}
                />
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            onClick={() => setCurrentMod(creationMods[0])}
          >
            <PhotoIcon className="mr-1 w-5 h-5" />
            Add image
          </Button>
          <CastLengthUIIndicator getText={getText} />
          <div className="grow"></div>
          <Button type="submit">Cast</Button>
        </div>
      </form>
      {hasEmbeds && (
        <div className="mt-8 rounded-md bg-muted px-4 max-w-xl break-all">
          {map(draft.embeds, (embed) => (
            <div key={`cast-embed-${embed.url}`}>
              {renderEmbedForUrl(embed)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
