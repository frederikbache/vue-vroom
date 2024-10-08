export default {
  title: 'Vue goes Vroom',
  description: 'Type safe stores and mock API with minimal config',
  base: '/vue-vroom/',

  themeConfig: {
    nav: [{ text: 'Guide', link: '/guide/intro/' }],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/frederikbache/vue-vroom' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Vroom?', link: '/guide/intro/' },
            { text: 'Getting started', link: '/guide/intro/getting-started' },
            { text: 'Configuration', link: '/guide/intro/config' },
            {
              text: 'Organisation / optimisation',
              link: '/guide/intro/organization',
            },
            { text: 'API helper', link: '/guide/intro/api' },
          ],
        },
        {
          text: 'Models and relations',
          items: [
            { text: 'Creating a model', link: '/guide/models/' },
            { text: 'CRUD stores and API', link: '/guide/models/api' },
            { text: 'Item actions', link: '/guide/models/item-actions' },
            { text: 'Singleton models', link: '/guide/models/singleton' },
            { text: 'Setting up relations', link: '/guide/models/relations' },
            { text: 'Pagination settings', link: '/guide/models/pagination' },
            { text: 'List meta fields', link: '/guide/models/meta' },
          ],
        },
        {
          text: 'Server and mock data',
          items: [
            { text: 'Enabling server', link: '/guide/server/' },
            { text: 'Seeding mock data', link: '/guide/server/seeding' },
            { text: 'Mocking custom filters', link: '/guide/server/filters' },
            { text: 'Mocking side effects', link: '/guide/server/sideeffects' },
            { text: 'Mocking meta fields', link: '/guide/server/meta' },
            { text: 'Custom routes', link: '/guide/server/routes' },
            { text: 'Mocking identity', link: '/guide/server/identity' },
          ],
        },
        {
          text: 'Listing items with useList',
          items: [
            { text: 'Intro', link: '/guide/using/use-list' },
            { text: 'Sorting', link: '/guide/using/use-list-sort' },
            { text: 'Pagination', link: '/guide/using/use-list-pagination' },
            { text: 'Filtering', link: '/guide/using/use-list-filter' },
            {
              text: 'Including relations',
              link: '/guide/using/use-list-include',
            },
          ],
        },
        {
          text: 'Fetching models',
          items: [
            {
              text: 'Showing lists with FetchList',
              link: '/guide/fetching/fetch-list',
            },
            { text: 'List sorting', link: '/guide/fetching/sorting' },
            { text: 'List pagination', link: '/guide/fetching/pagination' },
            { text: 'List filtering', link: '/guide/fetching/filters' },
            {
              text: 'Showing single models with FetchSingle',
              link: '/guide/fetching/fetch-single',
            },
            { text: 'Including relations', link: '/guide/fetching/relations' },
            { text: 'FetchSingleton', link: '/guide/fetching/singleton' },
          ],
        },
        {
          text: 'Testing',
          items: [
            {
              text: 'Using Vroom with Cypress',
              link: '/guide/testing/cypress',
            },
          ],
        },
      ],
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2022-present Frederik Bache',
    },
  },
};
