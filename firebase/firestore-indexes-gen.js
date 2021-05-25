const disables = {
  'announces': ['mid', 'posts', 'uT'],
  'meta': ['name', 'desc', 'link', 'icon', 'cT'],
  'posts': ['title', 'body', 'link', 'img', 'pT'],
  'images': ['data'],
  'notif-devices': ['signKey', 'lang', 'tz', 'follows', 'uT'],
  'notif-imm': ['announceID', 'followers', 'unfollows', 'archives', 'uT'],
  'archives': ['followers'],
};

const fieldOverrides = Object.entries(disables).reduce((a, [collectionGroup, fields]) => {
  a.push(
    ...fields.map(fieldPath => {
      return {
        collectionGroup,
        fieldPath,
        indexes: [],
      };
    }),
  );
  return a;
}, []);

const json = {
  indexes: [],
  fieldOverrides,
};

process.stdout.write(JSON.stringify(json, null, 2));
