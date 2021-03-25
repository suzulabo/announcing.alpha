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
    interface ApImageInput {
        "data": string;
        "label": string;
        "resizeRect": { width: number; height: number };
    }
    interface ApInput {
        "label": string;
        "maxLength": number;
        "textarea": boolean;
        "value": string;
    }
    interface ApLoading {
    }
    interface ApModal {
    }
    interface ApStyle {
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
    interface AppPost {
        "announceID": string;
        "app": App;
        "postID": string;
    }
    interface AppPostForm {
        "announceID": string;
        "app": App;
        "postID": string;
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
    interface HTMLApImageInputElement extends Components.ApImageInput, HTMLStencilElement {
    }
    var HTMLApImageInputElement: {
        prototype: HTMLApImageInputElement;
        new (): HTMLApImageInputElement;
    };
    interface HTMLApInputElement extends Components.ApInput, HTMLStencilElement {
    }
    var HTMLApInputElement: {
        prototype: HTMLApInputElement;
        new (): HTMLApInputElement;
    };
    interface HTMLApLoadingElement extends Components.ApLoading, HTMLStencilElement {
    }
    var HTMLApLoadingElement: {
        prototype: HTMLApLoadingElement;
        new (): HTMLApLoadingElement;
    };
    interface HTMLApModalElement extends Components.ApModal, HTMLStencilElement {
    }
    var HTMLApModalElement: {
        prototype: HTMLApModalElement;
        new (): HTMLApModalElement;
    };
    interface HTMLApStyleElement extends Components.ApStyle, HTMLStencilElement {
    }
    var HTMLApStyleElement: {
        prototype: HTMLApStyleElement;
        new (): HTMLApStyleElement;
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
    interface HTMLAppPostElement extends Components.AppPost, HTMLStencilElement {
    }
    var HTMLAppPostElement: {
        prototype: HTMLAppPostElement;
        new (): HTMLAppPostElement;
    };
    interface HTMLAppPostFormElement extends Components.AppPostForm, HTMLStencilElement {
    }
    var HTMLAppPostFormElement: {
        prototype: HTMLAppPostFormElement;
        new (): HTMLAppPostFormElement;
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
        "ap-image-input": HTMLApImageInputElement;
        "ap-input": HTMLApInputElement;
        "ap-loading": HTMLApLoadingElement;
        "ap-modal": HTMLApModalElement;
        "ap-style": HTMLApStyleElement;
        "app-announce-create": HTMLAppAnnounceCreateElement;
        "app-announce-edit": HTMLAppAnnounceEditElement;
        "app-home": HTMLAppHomeElement;
        "app-post": HTMLAppPostElement;
        "app-post-form": HTMLAppPostFormElement;
        "app-posts": HTMLAppPostsElement;
        "app-root": HTMLAppRootElement;
        "app-signin": HTMLAppSigninElement;
    }
}
declare namespace LocalJSX {
    interface ApIcon {
        "icon"?: 'github' | 'google' | 'image' | 'trash';
    }
    interface ApImageInput {
        "data"?: string;
        "label"?: string;
        "onImageChange"?: (event: CustomEvent<string>) => void;
        "onImageResizing"?: (event: CustomEvent<boolean>) => void;
        "resizeRect"?: { width: number; height: number };
    }
    interface ApInput {
        "label"?: string;
        "maxLength"?: number;
        "textarea"?: boolean;
        "value"?: string;
    }
    interface ApLoading {
    }
    interface ApModal {
        "onClose"?: (event: CustomEvent<any>) => void;
    }
    interface ApStyle {
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
    interface AppPost {
        "announceID"?: string;
        "app"?: App;
        "postID"?: string;
    }
    interface AppPostForm {
        "announceID"?: string;
        "app"?: App;
        "postID"?: string;
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
        "ap-image-input": ApImageInput;
        "ap-input": ApInput;
        "ap-loading": ApLoading;
        "ap-modal": ApModal;
        "ap-style": ApStyle;
        "app-announce-create": AppAnnounceCreate;
        "app-announce-edit": AppAnnounceEdit;
        "app-home": AppHome;
        "app-post": AppPost;
        "app-post-form": AppPostForm;
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
            "ap-image-input": LocalJSX.ApImageInput & JSXBase.HTMLAttributes<HTMLApImageInputElement>;
            "ap-input": LocalJSX.ApInput & JSXBase.HTMLAttributes<HTMLApInputElement>;
            "ap-loading": LocalJSX.ApLoading & JSXBase.HTMLAttributes<HTMLApLoadingElement>;
            "ap-modal": LocalJSX.ApModal & JSXBase.HTMLAttributes<HTMLApModalElement>;
            "ap-style": LocalJSX.ApStyle & JSXBase.HTMLAttributes<HTMLApStyleElement>;
            "app-announce-create": LocalJSX.AppAnnounceCreate & JSXBase.HTMLAttributes<HTMLAppAnnounceCreateElement>;
            "app-announce-edit": LocalJSX.AppAnnounceEdit & JSXBase.HTMLAttributes<HTMLAppAnnounceEditElement>;
            "app-home": LocalJSX.AppHome & JSXBase.HTMLAttributes<HTMLAppHomeElement>;
            "app-post": LocalJSX.AppPost & JSXBase.HTMLAttributes<HTMLAppPostElement>;
            "app-post-form": LocalJSX.AppPostForm & JSXBase.HTMLAttributes<HTMLAppPostFormElement>;
            "app-posts": LocalJSX.AppPosts & JSXBase.HTMLAttributes<HTMLAppPostsElement>;
            "app-root": LocalJSX.AppRoot & JSXBase.HTMLAttributes<HTMLAppRootElement>;
            "app-signin": LocalJSX.AppSignin & JSXBase.HTMLAttributes<HTMLAppSigninElement>;
        }
    }
}
