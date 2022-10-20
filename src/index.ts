import defineModel from './defineModel';
import createVroom from './createVroom';
import type { VNode } from 'vue';
import ServerError from './ServerError';

export type { VroomDb } from './server/createDb';

export type FetchListComponent<Instance> = {
  new (): {
    $props: {
      // @ts-expect-error
      model: Instance extends object ? keyof Instance['types'] : string;
    };
    $emit: (
      event: 'ready',
      fetch: {
        refresh: () => void;
        create: (data: any) => void;
        pushId: (
          // @ts-expect-error
          id: Instance['settings'] extends { idsAreNumbers: true }
            ? number
            : string
        ) => void;
      }
    ) => void;
    $slots: {
      default?: (
        props: {
          // @ts-expect-error
          [K in keyof Instance['types'] as `${K}Items`]: Instance['types'][K][];
        } & {
          meta: {
            // @ts-expect-error
            nextCursor?: Instance['settings'] extends { idsAreNumbers: true }
              ? number
              : string;
            page: number;
            pages: number;
            results: number;
            refresh: () => void;
            create: (data: any) => void;
            pushId: (
              // @ts-expect-error
              id: Instance['settings'] extends { idsAreNumbers: true }
                ? number
                : string
            ) => void;
          };
        }
      ) => VNode[];
      loading?: () => VNode[];
      failed?: (props: { error: { status: number; data?: any } }) => VNode[];
    };
  };
};

export type FetchSingleComponent<Instance> = {
  new (): {
    $props: {
      // @ts-expect-error
      model: Instance extends object ? keyof Instance['types'] : string;
      // @ts-expect-error
      id: Instance['settings'] extends { idsAreNumbers: true }
        ? number
        : string;
    };
    $slots: {
      default?: (props: {
        // @ts-expect-error
        [K in keyof Instance['types']]: Instance['types'][K];
      }) => VNode[];
      loading?: () => VNode[];
      failed?: (props: { error: { status: number; data?: any } }) => VNode[];
    };
  };
};

export type FetchSingletonComponent<Instance> = {
  new (): {
    $props: {
      // @ts-expect-error
      model: Instance extends object ? keyof Instance['types'] : string;
    };
    $slots: {
      default?: (props: {
        // @ts-expect-error
        [K in keyof Instance['types']]: Instance['types'][K];
      }) => VNode[];
      loading?: () => VNode[];
      failed?: (props: { error: { status: number; data?: any } }) => VNode[];
    };
  };
};

export { ServerError, defineModel, createVroom };
