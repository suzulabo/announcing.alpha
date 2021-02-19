/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { App } from "src/app/app";
export namespace Components {
    interface ApIcon {
        "icon": 'github' | 'google' | 'image' | 'trash';
    }
    interface ApLoading {
    }
    interface AppAnnounceCreate {
        "app": App;
    }
    interface AppAnnounceEdit {
        "announceID": string;
        "app": App;
    }
    interface AppHome {
        "app": App;
    }
    interface AppPosts {
        "announceID": string;
        "app": App;
    }
    interface AppRoot {
    }
    interface AppSignin {
        "app": App;
    }
}
declare global {
    interface HTMLApIconElement extends Components.ApIcon, HTMLStencilElement {
    }
    var HTMLApIconElement: {
        prototype: HTMLApIconElement;
        new (): HTMLApIconElement;
    };
    interface HTMLApLoadingElement extends Components.ApLoading, HTMLStencilElement {
    }
    var HTMLApLoadingElement: {
        prototype: HTMLApLoadingElement;
        new (): HTMLApLoadingElement;
    };
    interface HTMLAppAnnounceCreateElement extends Components.AppAnnounceCreate, HTMLStencilElement {
    }
    var HTMLAppAnnounceCreateElement: {
        prototype: HTMLAppAnnounceCreateElement;
        new (): HTMLAppAnnounceCreateElement;
    };
    interface HTMLAppAnnounceEditElement extends Components.AppAnnounceEdit, HTMLStencilElement {
    }
    var HTMLAppAnnounceEditElement: {
        prototype: HTMLAppAnnounceEditElement;
        new (): HTMLAppAnnounceEditElement;
    };
    interface HTMLAppHomeElement extends Components.AppHome, HTMLStencilElement {
    }
    var HTMLAppHomeElement: {
        prototype: HTMLAppHomeElement;
        new (): HTMLAppHomeElement;
    };
    interface HTMLAppPostsElement extends Components.AppPosts, HTMLStencilElement {
    }
    var HTMLAppPostsElement: {
        prototype: HTMLAppPostsElement;
        new (): HTMLAppPostsElement;
    };
    interface HTMLAppRootElement extends Components.AppRoot, HTMLStencilElement {
    }
    var HTMLAppRootElement: {
        prototype: HTMLAppRootElement;
        new (): HTMLAppRootElement;
    };
    interface HTMLAppSigninElement extends Components.AppSignin, HTMLStencilElement {
    }
    var HTMLAppSigninElement: {
        prototype: HTMLAppSigninElement;
        new (): HTMLAppSigninElement;
    };
    interface HTMLElementTagNameMap {
        "ap-icon": HTMLApIconElement;
        "ap-loading": HTMLApLoadingElement;
        "app-announce-create": HTMLAppAnnounceCreateElement;
        "app-announce-edit": HTMLAppAnnounceEditElement;
        "app-home": HTMLAppHomeElement;
        "app-posts": HTMLAppPostsElement;
        "app-root": HTMLAppRootElement;
        "app-signin": HTMLAppSigninElement;
    }
}
declare namespace LocalJSX {
    interface ApIcon {
        "icon"?: 'github' | 'google' | 'image' | 'trash';
    }
    interface ApLoading {
    }
    interface AppAnnounceCreate {
        "app"?: App;
    }
    interface AppAnnounceEdit {
        "announceID"?: string;
        "app"?: App;
    }
    interface AppHome {
        "app"?: App;
    }
    interface AppPosts {
        "announceID"?: string;
        "app"?: App;
    }
    interface AppRoot {
    }
    interface AppSignin {
        "app"?: App;
    }
    interface IntrinsicElements {
        "ap-icon": ApIcon;
        "ap-loading": ApLoading;
        "app-announce-create": AppAnnounceCreate;
        "app-announce-edit": AppAnnounceEdit;
        "app-home": AppHome;
        "app-posts": AppPosts;
        "app-root": AppRoot;
        "app-signin": AppSignin;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "ap-icon": LocalJSX.ApIcon & JSXBase.HTMLAttributes<HTMLApIconElement>;
            "ap-loading": LocalJSX.ApLoading & JSXBase.HTMLAttributes<HTMLApLoadingElement>;
            "app-announce-create": LocalJSX.AppAnnounceCreate & JSXBase.HTMLAttributes<HTMLAppAnnounceCreateElement>;
            "app-announce-edit": LocalJSX.AppAnnounceEdit & JSXBase.HTMLAttributes<HTMLAppAnnounceEditElement>;
            "app-home": LocalJSX.AppHome & JSXBase.HTMLAttributes<HTMLAppHomeElement>;
            "app-posts": LocalJSX.AppPosts & JSXBase.HTMLAttributes<HTMLAppPostsElement>;
            "app-root": LocalJSX.AppRoot & JSXBase.HTMLAttributes<HTMLAppRootElement>;
            "app-signin": LocalJSX.AppSignin & JSXBase.HTMLAttributes<HTMLAppSigninElement>;
        }
    }
}
