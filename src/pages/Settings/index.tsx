import { supabaseClient } from "@/common/helpers/supabase";
import { User } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";


export default function Settings() {
  // get supabase user
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      setUser(user);
    }
    getUser();
  }, [])
  const onLogout = async () => {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession()
    console.log('session', session);

    if (session) {
      await supabaseClient.auth.signOut()
    }
  }

  return (
    <div className="flex flex-col">
      <span className="text-lg font-semibold text-white mb-8">Settings</span>
      <div className="flex flex-row mb-4">
        <span className="text-sm font-semibold text-gray-400 mr-2">User</span>
        <span className="text-sm font-semibold text-white">{user?.email}</span>
      </div>
      {/* <button
        type="button"
        onSubmit={() => onLogout()}
        className="inline-flex items-center rounded-sm bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
      >
        Logout
      </button> */}
    </div>
  )
}
