import GameState from "../../GameState";
import House from "../game-data-structure/House";
import Region from "../game-data-structure/Region";
import Player from "../Player";
import Game from "../game-data-structure/Game";
import {ClientMessage} from "../../../messages/ClientMessage";
import {ServerMessage} from "../../../messages/ServerMessage";
import EntireGame from "../../EntireGame";
import IngameGameState from "../IngameGameState";
import User from "../../../server/User";
import ActionGameState from "../action-game-state/ActionGameState";

export interface ParentGameState extends GameState<any, any> {
    entireGame: EntireGame;
    ingame: IngameGameState;
    actionGameState: ActionGameState;
    game: Game;

    onSelectOrdersFinish(selectedOrders: Region[], resolvedAutomatically: boolean): void;
}

export default class SelectOrdersGameState<P extends ParentGameState> extends GameState<P> {
    house: House;
    possibleRegions: Region[];
    count: number;

    get entireGame(): EntireGame {
        return this.parentGameState.entireGame;
    }

    get game(): Game {
        return this.parentGameState.game;
    }

    firstStart(house: House, possibleRegions: Region[], count: number): void {
        possibleRegions.forEach(r => {
            if (!this.parentGameState.actionGameState.ordersOnBoard.has(r)) {
                throw new Error(`SelectOrdersGameState called but region ${r.name} is a possible region which does not contain an order!`);
            }
        });

        this.house = house;
        this.possibleRegions = possibleRegions;
        this.count = count;

        // If possible regions count equals to the amount of orders to select
        // we can fast-track this state
        if (possibleRegions.length == count) {
            this.parentGameState.onSelectOrdersFinish(possibleRegions, true);
        }
    }

    onPlayerMessage(player: Player, message: ClientMessage): void {
        if (message.type == "select-orders") {
            const regions = message.regions.map(rid => this.game.world.regions.get(rid));

            if (this.parentGameState.ingame.getControllerOfHouse(this.house) != player) {
                return;
            }

            if (regions.length != this.count) {
                return;
            }

            this.parentGameState.onSelectOrdersFinish(regions, false);
        }
    }

    onServerMessage(_message: ServerMessage): void {
    }

    getWaitedUsers(): User[] {
        return [this.parentGameState.ingame.getControllerOfHouse(this.house).user];
    }

    selectOrders(regions: Region[]): void {
        this.entireGame.sendMessageToServer({
            type: "select-orders",
            regions: regions.map(r => r.id)
        });
    }

    serializeToClient(_admin: boolean, _player: Player | null): SerializedSelectOrdersGameState{
        return {
            type: "select-orders",
            house: this.house.id,
            possibleRegions: this.possibleRegions.map(r => r.id),
            count: this.count
        };
    }

    static deserializeFromServer<P extends ParentGameState>(parent: P, data: SerializedSelectOrdersGameState): SelectOrdersGameState<P> {
        const selectOrders = new SelectOrdersGameState(parent);

        selectOrders.house = parent.game.houses.get(data.house);
        selectOrders.possibleRegions = data.possibleRegions.map(rid => parent.game.world.regions.get(rid));
        selectOrders.count = data.count;

        return selectOrders;
    }
}

export interface SerializedSelectOrdersGameState {
    type: "select-orders";
    house: string;
    possibleRegions: string[];
    count: number;
}
