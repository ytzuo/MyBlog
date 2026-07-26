import elecmonkeyAvatar from "../assets/elecmonkey.png";

export interface FriendLink {
    name: string;
    titleSuffix?: string;
    url: string;
    description: string;
    descriptionEn?: string;
    avatar?: ImageMetadata;
}

export const friendLinks: FriendLink[] = [
    {
        name: "Elecmonkey",
        titleSuffix: "'s Garden",
        url: "https://elecmonkey.com",
        description: "来自 elecmonkey.com 的友情链接。",
        descriptionEn: "A friend of this site from elecmonkey.com.",
        avatar: elecmonkeyAvatar,
    },
];
