// Capture install events before the application's module graph finishes loading.
(()=>{
  const boot=window.LEAGUEFOLK_PWA_BOOT={prompt:null,installed:false};
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();boot.prompt=event;boot.installed=false;});
  window.addEventListener('appinstalled',()=>{boot.prompt=null;boot.installed=true;});
})();
