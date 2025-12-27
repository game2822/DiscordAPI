import { RestManager } from "../rest/RESTManager";
import { BASE_URL, GET_MESSAGES_FOR_CHANNEL, SEND_MESSAGES_IN_CHANNEL, DELETE_MESSAGE_IN_CHANNEL, EDIT_MESSAGE_IN_CHANNEL } from "../rest/endpoints";

export const GetMessagesForChannel = async (Channel_ID: string, token: string) => {
    const manager = new RestManager(BASE_URL);

    return manager.get<string>(
        GET_MESSAGES_FOR_CHANNEL(Channel_ID),
        undefined,
        {
            "Content-Type": "application/json",
            Authorization: token,
        }
    );
}

export const SendMessageInChannel = async (Channel_ID: string, content: string, token: string) => {
    const manager = new RestManager(BASE_URL);
    return manager.post<any>(SEND_MESSAGES_IN_CHANNEL(Channel_ID), {
        content: content,
        tts: false,
    }, undefined,
     {
        headers: {
        "Content-Type": "application/json",
        Authorization: token,
    }
    });
}

export const DeleteMessageInChannel = async (Channel_ID: string, Message_ID: string, token: string) => {
    const manager = new RestManager(BASE_URL);
    return manager.delete<void>(
        DELETE_MESSAGE_IN_CHANNEL(Channel_ID, Message_ID), undefined, {
        headers: {
            "Content-Type": "application/json",
            Authorization: token,
        }
    }, true);
}

export const EditMessageInChannel = async (Channel_ID: string, Message_ID: string, newContent: string, token: string) => {
    const manager = new RestManager(BASE_URL);
    return manager.patch<string>(
        EDIT_MESSAGE_IN_CHANNEL(Channel_ID, Message_ID),
        {
            content: newContent,
        },
            undefined,
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: token,   
            }
        }
    );
}