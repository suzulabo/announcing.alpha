import { Match, pathMatcher } from 'src/path-matcher';

describe('path-matcher', () => {
  describe('tags', () => {
    const matches: (Match & { tag: string })[] = [
      {
        pattern: '',
        tag: 'app-home',
      },
      {
        pattern: /^[0-9A-Z]{12}$/,
        name: 'announceID',
        tag: 'app-announce',
        nexts: [
          {
            pattern: 'config',
            tag: 'app-announce-config',
          },
          {
            pattern: /^[0-9a-zA-Z]{8}$/,
            name: 'postID',
            tag: 'app-post',
            nexts: [
              {
                pattern: 'image',
                nexts: [
                  {
                    pattern: /^[0-9a-zA-Z]{15,25}$/,
                    name: 'imageID',
                    tag: 'app-image',
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const tests: {
      path: string;
      invalid?: boolean;
      tag?: string;
      params?: { [k: string]: string };
    }[][] = [
      [{ path: '/', tag: 'app-home' }],
      [{ path: '/1234567890AB', tag: 'app-announce', params: { announceID: '1234567890AB' } }],
      [
        {
          path: '/1234567890AB/config',
          tag: 'app-announce-config',
          params: { announceID: '1234567890AB' },
        },
      ],
      [
        {
          path: '/1234567890AB/123abcDE',
          tag: 'app-post',
          params: { announceID: '1234567890AB', postID: '123abcDE' },
        },
      ],
      [
        {
          path: '/1234567890AB/123abcDE/image/1234567890abcDE',
          tag: 'app-image',
          params: { announceID: '1234567890AB', postID: '123abcDE', imageID: '1234567890abcDE' },
        },
      ],
      [{ path: '/1234567890ABx', invalid: true }],
      [{ path: '/1234567890AB/123abcDEx', invalid: true }],
      [{ path: '/1234567890AB/123abcDE/image/1234567890', invalid: true }],
    ];

    test.each(tests)('%p', x => {
      const r = pathMatcher(matches, x.path);
      if (x.invalid) {
        expect(r).toBeUndefined();
      } else {
        expect(r).not.toBeUndefined();
      }
      if (!r) {
        return;
      }
      if (x.tag) {
        expect(r.match.tag).toEqual(x.tag);
      }
      if (x.params) {
        expect(r.params).toEqual(x.params);
      }
    });
  });
});
