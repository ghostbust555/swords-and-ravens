import WebsiteClient, {StoredGameData, StoredUserData} from "./WebsiteClient";
import User from "../User";

export default class LocalWebsiteClient implements WebsiteClient {
    async getGame(gameId: string): Promise<StoredGameData> {
        if (gameId != "1") {
            throw new Error();
        }

        return {
            id: gameId,
            name: "Local Test Game",
            ownerId: "1",
            serializedGame: null,
            version: null
        };
    }

    async getUser(userId: string): Promise<StoredUserData> {
        return {
            id: userId,
            name: `Super Long Player Name #${userId}`,
            token: userId,
            profileSettings: {
                muted: true,
                houseNamesForChat: true,
                mapScrollbar: true,
                responsiveLayout: false
            }
        };
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/ban-types
    async saveGame(_gameId: string, _serializedGame: any, _viewOfGame: any, _players: {userId: string; data: object}[], _state: string, _version: string, updateLastActive: boolean): Promise<void> {
        console.log("Game saved. updateLastActive: " + updateLastActive);
    }

    async notifyReadyToStart(_gameId: string, userIds: string[]): Promise<void> {
        console.log(`notifyReadyToStart: ${userIds.join(", ")}`);
    }

    async notifyYourTurn(_gameId: string, userIds: string[]): Promise<void> {
        console.log(`notifyYourTurn: ${userIds.join(", ")}`);
    }

    async notifyBribeForSupport(gameId: string, userIds: string[]): Promise<void> {
        console.log(`notifyBribeForSupport: ${userIds.join(", ")}`);
    }

    async notifyBattleResults(_gameId: string, userIds: string[]): Promise<void> {
        console.log(`notifyBattleResults: ${userIds.join(", ")}`);
    }

    async notifyNewVote(_gameId: string, userIds: string[]): Promise<void> {
        console.log(`notifyNewVoteStarted: ${userIds.join(", ")}`);
    }

    async notifyGameEnded(_gameId: string, userIds: string[]): Promise<void> {
        console.log(`notifyGameEnded: ${userIds.join(", ")}`);
    }

    async addPbemResponseTime(user: User, responseTimeInSeconds: number): Promise<void> {
        console.log(`ADD-PBEM-RESPONSE-TIME: ${user.name}: ${responseTimeInSeconds}`);
    }

    async createPublicChatRoom(name: string): Promise<string> {
        return `chat-${name}`;
    }

    async createPrivateChatRoom(users: User[], _name: string): Promise<string> {
        return `private-chat-between-${users.map(u => u.name).join("-")}`;
    }

    async clearChatRoom(roomId: string): Promise<void> {
        console.log("room " + roomId + " cleared.");
    }
}
