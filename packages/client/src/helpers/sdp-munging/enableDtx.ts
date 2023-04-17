export const enableDtx = (sdp: string) => {
  return sdp.replace('useinbandfec=1', 'useinbandfec=1;usedtx=1');
};
