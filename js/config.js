/* Supabase connection (safe to publish: this is the *publishable* key; all data
   access is restricted by Row Level Security). Never put the database password
   or a secret / service_role key in this repository. */
window.APP_CONFIG = {
  SUPABASE_URL: "https://dhgipmcrdpyphzrgmglu.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_LEkMRIgEydhwXvL-ukLXug_OZH32_sH",
  SUPABASE_SDK: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1/dist/umd/supabase.js"
};

/* Loads the Supabase SDK on demand and returns a shared client. */
window.getSupabase = (function () {
  var clientPromise = null;

  function loadSdk() {
    return new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) return resolve();
      var s = document.createElement("script");
      s.src = window.APP_CONFIG.SUPABASE_SDK;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Could not load the messaging service.")); };
      document.head.appendChild(s);
    });
  }

  return function () {
    if (!clientPromise) {
      clientPromise = loadSdk().then(function () {
        return window.supabase.createClient(
          window.APP_CONFIG.SUPABASE_URL,
          window.APP_CONFIG.SUPABASE_PUBLISHABLE_KEY
        );
      });
      clientPromise.catch(function () { clientPromise = null; });
    }
    return clientPromise;
  };
})();
