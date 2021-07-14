const disables = {
  'announces': ['mid', 'posts', 'uT'],
  'posts': ['title', 'body', 'link', 'img', 'edited', 'pT'],
  'meta': ['name', 'desc', 'link', 'icon', 'cT'],
  'images': ['data'],
  'notif-devices': ['signKey', 'lang', 'announces', 'uT'],
  'notif-imm': ['announceID', 'devices', 'cancels', 'archives', 'uT'],
  'archives': ['devices'],
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
