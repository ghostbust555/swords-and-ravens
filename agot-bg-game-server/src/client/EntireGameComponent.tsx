import {observer} from "mobx-react";
import {Component, default as React, ReactNode} from "react";
import EntireGame from "../common/EntireGame";
import GameClient from "./GameClient";
import LobbyGameState from "../common/lobby-game-state/LobbyGameState";
import IngameGameState from "../common/ingame-game-state/IngameGameState";
import IngameComponent from "./IngameComponent";
import LobbyComponent from "./LobbyComponent";
import CancelledComponent from "./CancelledComponent";
import CancelledGameState from "../common/cancelled-game-state/CancelledGameState";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";
import notificationSound from "../../public/sounds/notification.ogg";
import faviconNormal from "../../public/images/favicon.ico";
import faviconAlert from "../../public/images/favicon-alert.ico";
import rollingDicesImage from "../../public/images/icons/rolling-dices.svg";
import cardExchangeImage from "../../public/images/icons/card-exchange.svg";
import {Helmet} from "react-helmet";
import { Card, FormCheck, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { preventOverflow } from "@popperjs/core";
import DraftHouseCardsGameState from "../common/ingame-game-state/draft-house-cards-game-state/DraftHouseCardsGameState";
import { observable } from "mobx";
import HouseIconComponent from "./game-state-panel/utils/HouseIconComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamation, faLock } from "@fortawesome/free-solid-svg-icons";
import _ from "lodash";
import GameEndedGameState from "../common/ingame-game-state/game-ended-game-state/GameEndedGameState";
import { secondsToString } from "./utils/secondsToString";
import introSound from "../../public/sounds/game-of-thrones-intro.ogg";
import CombatGameState from "../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/CombatGameState";
import { GameResumed } from "../common/ingame-game-state/game-data-structure/GameLog";
import { getTimeDeltaInSeconds } from "../utils/getElapsedSeconds";
import { toast } from "react-toastify";
import { cssTransition } from "react-toastify";

const yourTurnToastAnimation = cssTransition({
    enter: "slide-in-elliptic-top-fwd",
    exit: "slide-out-elliptic-top-bck"
});

interface EntireGameComponentProps {
    entireGame: EntireGame;
    gameClient: GameClient;
}

@observer
export default class EntireGameComponent extends Component<EntireGameComponentProps> {
    @observable showMapWhenDrafting = false;
    @observable rerender = 0;
    @observable playWelcomeSound = false;

    setIntervalId = -1;

    get ingame(): IngameGameState | null {
        return this.props.entireGame.ingameGameState;
    }

    get lobby(): LobbyGameState | null {
        return this.props.entireGame.lobbyGameState;
    }

    get isGameEnded(): boolean {
        return this.props.entireGame.leafState instanceof CancelledGameState ||
            this.props.entireGame.leafState instanceof GameEndedGameState;
    }

    get isInCombat (): boolean {
        return this.props.entireGame.hasChildGameState(CombatGameState);
    }

    render(): ReactNode {
        return <>
            <Helmet>
                <link rel="icon" href={this.props.gameClient.isOwnTurn() ? faviconAlert : faviconNormal} sizes="16x16" />
            </Helmet>
            <Col xs={12} className={this.props.entireGame.childGameState instanceof IngameGameState ? "pb-0" : "pb-2"}>
                <Row className="justify-content-center align-items-center">
                    {this.renderPrivateBadge()}
                    {this.renderHouseIcon()}
                    <Col xs="auto">
                        <h4>{this.props.entireGame.name}</h4>
                    </Col>
                    {this.renderTidesOfBattleImage()}
                    {this.renderHouseCardsEvolutionImage()}
                    {this.renderGameTypeBadge()}
                    {this.renderMapSwitch()}
                    {this.renderWarnings()}
                    {this.rerender >= 0 && this.renderClock()}
                </Row>
            </Col>
            {
                this.props.entireGame.childGameState instanceof LobbyGameState ? (
                    <LobbyComponent gameClient={this.props.gameClient} gameState={this.props.entireGame.childGameState} />
                ) : this.props.entireGame.childGameState instanceof IngameGameState ? (
                    <IngameComponent gameClient={this.props.gameClient} gameState={this.props.entireGame.childGameState} />
                ) : this.props.entireGame.childGameState instanceof CancelledGameState && (
                    <CancelledComponent gameClient={this.props.gameClient} gameState={this.props.entireGame.childGameState} />
                )
            }
            {this.playWelcomeSound && !this.props.gameClient.musicMuted &&
                <audio id="welcome-sound" src={introSound} autoPlay onEnded={() => this.playWelcomeSound = false} />
            }
        </>;
    }

    renderTidesOfBattleImage(): ReactNode {
        return this.props.entireGame.gameSettings.tidesOfBattle &&
            <Col xs="auto">
                <OverlayTrigger
                    placement="auto"
                    overlay={
                        <Tooltip id="tob-active-tooltip">
                            <Col className="text-center">
                                Tides of Battle
                                {this.props.entireGame.gameSettings.removeTob3 && <>
                                    <br/><small>No 3s</small>
                                </>}
                                {this.props.entireGame.gameSettings.removeTobSkulls && <>
                                    <br/><small>No skulls</small>
                                </>}
                                {this.props.entireGame.gameSettings.limitTob2 && <>
                                    <br/><small>Only two 2s</small>
                                </>}
                            </Col>
                        </Tooltip>}
                    popperConfig={{ modifiers: [preventOverflow] }}
                >
                    <img src={rollingDicesImage} width="30" />
                </OverlayTrigger>
            </Col>;
    }

    renderHouseCardsEvolutionImage(): ReactNode {
        return this.props.entireGame.gameSettings.houseCardsEvolution &&
            <Col xs="auto">
                <OverlayTrigger
                    placement="auto"
                    overlay={
                        <Tooltip id="evolution-active-tooltip">
                            From round <b>5</b> onwards, each house returns its alternative deck when the last house card has been played.
                        </Tooltip>}
                    popperConfig={{ modifiers: [preventOverflow] }}
                >
                    <img src={cardExchangeImage} width="30" />
                </OverlayTrigger>
            </Col>;
    }

    renderPrivateBadge(): ReactNode {
        return !this.props.entireGame.gameSettings.private ? <></> :
            <Col xs="auto">
                <h4>
                    <Badge variant="primary"><FontAwesomeIcon icon={faLock} className="mr-2" size="sm"/>PRIVATE</Badge>
                </h4>
            </Col>;
    }

    renderGameTypeBadge(): ReactNode {
        return <Col xs="auto">
            <h4>
                {this.props.entireGame.gameSettings.pbem
                    ? <Badge variant="primary">PBEM</Badge>
                    : <Badge variant="success">Live</Badge>}
            </h4>
        </Col>;
    }

    renderWarnings(): ReactNode {
        return <>
            {this.props.entireGame.ingameGameState?.paused &&
            <Col xs="auto">
                <h4><Badge variant="danger">PAUSED</Badge></h4>
            </Col>}
            {this.props.entireGame.gameSettings.reduceVictoryPointsCountNeededToWinTo6 &&
            <Col xs="auto">
                <OverlayTrigger
                    placement="auto"
                    overlay={
                        <Tooltip id="vp-counts-reduced-tooltip">
                            <Col className="text-center">
                                The number of victory points required for winning is reduced to <b>6</b> instead of 7!
                            </Col>
                        </Tooltip>}
                    popperConfig={{ modifiers: [preventOverflow] }}
                >
                    <h4><Badge variant="warning"><FontAwesomeIcon icon={faExclamation} size="sm"/></Badge></h4>
                </OverlayTrigger>
            </Col>}
            {this.props.entireGame.isDanceWithMotherOfDragons &&
            <Col xs="auto">
                <h4><Badge variant="warning">BETA</Badge></h4>
            </Col>}
        </>;
    }

    renderClock(): ReactNode {
        if (this.ingame?.willBeAutoResumedAt) {
            // Show a 10 minutes countdown
            const countdown = secondsToString(getTimeDeltaInSeconds(this.ingame?.willBeAutoResumedAt, new Date()), true);

            return <Col xs="auto">
                <OverlayTrigger
                    placement="bottom"
                    overlay={
                        <Tooltip id="game-resumes-tooltip">
                            <b>Countdown until game resumes</b>
                        </Tooltip>}
                    popperConfig={{ modifiers: [preventOverflow] }}
                >
                    <h4><Badge variant="secondary">{countdown}</Badge></h4>
                </OverlayTrigger>
            </Col>;
        } else if (this.ingame) {
            let totalPlayingTime: string | null = null;
            const gameLogManager = this.props.entireGame.ingameGameState?.gameLogManager;
            const firstLog = _.first(gameLogManager?.logs ?? []);

            if (firstLog) {
                const lastTimeStamp = this.ingame.paused
                    ? this.ingame.paused
                    : this.isGameEnded
                        ? _.last(gameLogManager?.logs ?? [])?.time ?? new Date()
                        : new Date();

                // Remove pause times:
                const totalPauseTime = _.sum(gameLogManager?.logs.filter(l => l.data.type == "game-resumed")
                    .map(l => (l.data as GameResumed).pauseTimeInSeconds));

                let elapsed = getTimeDeltaInSeconds(lastTimeStamp, firstLog.time);
                elapsed -= totalPauseTime;

                totalPlayingTime = secondsToString(elapsed);
            }

            return totalPlayingTime && <Col xs="auto">
                <OverlayTrigger
                    placement="bottom"
                    overlay={
                        <Tooltip id="total-playing-time-tooltip">
                            <b>Total playing time</b>
                        </Tooltip>}
                    popperConfig={{ modifiers: [preventOverflow] }}
                >
                    <h4><Badge variant="secondary">{totalPlayingTime}</Badge></h4>
                </OverlayTrigger>
            </Col>;
        } else if (this.lobby && this.lobby.readyCheckWillTimeoutAt) {
            // Show a 30 seconds countdown
            const countdown = getTimeDeltaInSeconds(this.lobby.readyCheckWillTimeoutAt, new Date());

            return <Col xs="auto">
                <OverlayTrigger
                    placement="bottom"
                    overlay={
                        <Tooltip id="ready-check-countdown-tooltip">
                            <b>Countdown for Ready Check</b>
                        </Tooltip>}
                    popperConfig={{ modifiers: [preventOverflow] }}
                >
                    <h4><Badge variant="secondary">{countdown}</Badge></h4>
                </OverlayTrigger>
            </Col>;
        }else if (this.lobby) {
            return <OverlayTrigger
                placement="bottom"
                overlay={
                    <Tooltip id="westeros-time-tooltip">
                        <b>Westeros time <small>(basically UTC)</small></b>
                    </Tooltip>}
                popperConfig={{ modifiers: [preventOverflow] }}
            >
                <h4><Badge variant="secondary">{new Date().toISOString().slice(11, 16)}</Badge></h4>
            </OverlayTrigger>
        }

        return null;
    }

    renderHouseIcon(): ReactNode {
        // Hack for ADWD Bolton as the Ingame c'tor is not called here yet:
        const house = this.props.gameClient.authenticatedPlayer?.house;
        if (house && this.props.entireGame.gameSettings.adwdHouseCards && house.id == "stark") {
            house.name = "Bolton";
        }
        return house &&
            <Col xs="auto">
                <div style={{marginTop: "-4px"}}>
                    <HouseIconComponent house={house} small={true}/>
                </div>
            </Col>;
    }

    renderMapSwitch(): ReactNode {
        return this.props.entireGame.hasChildGameState(DraftHouseCardsGameState) &&
            <Col xs="auto">
                <FormCheck
                    id="show-hide-map-setting"
                    type="switch"
                    label="Show map"
                    style={{ marginTop: "-6px" }}
                    checked={this.showMapWhenDrafting}
                    onChange={() => {
                        this.showMapWhenDrafting = !this.showMapWhenDrafting;
                        this.changeUserSettings();
                    }}
                />
            </Col>;
    }

    changeUserSettings(): void {
        if (!this.props.gameClient.authenticatedUser) {
            return;
        }
        const user = this.props.gameClient.authenticatedUser;
        user.settings.showMapWhenDrafting = this.showMapWhenDrafting;
        user.syncSettings();
    }

    forceClockRerender(): void {
        if (this.rerender > 0) {
            this.rerender--;
        } else {
            this.rerender++;
        }
    }

    componentDidMount(): void {
        document.title = this.props.entireGame.name;

        if (this.isGameEnded) {
            return;
        }

        this.props.entireGame.onClientGameStateChange = () => this.onClientGameStateChange();
        this.props.entireGame.onGameStarted = () => this.onGameStarted();

        if (this.props.gameClient.authenticatedUser) {
            this.showMapWhenDrafting = this.props.gameClient.authenticatedUser.settings.showMapWhenDrafting;
        }

        this.setIntervalId = window.setInterval(() => this.forceClockRerender(), 1000);

        if (!this.isInCombat) {
            this.playWelcomeSound = true;
        }
    }

    onGameStarted(): void {
        const audio = document.getElementById("welcome-sound") as HTMLAudioElement;
        // Make sure it's not playing right now
        if (audio && !audio.paused) {
            return;
        }

        if (!this.props.gameClient.musicMuted) {
            const intro = new Audio(introSound);
            intro.play();
        }
    }

    onClientGameStateChange(): void {
        if (this.props.gameClient.isOwnTurn()) {
            if (!this.props.gameClient.muted) {
                const audio = new Audio(notificationSound);
                audio.play();
            }

            const player = this.props.gameClient.authenticatedPlayer;
            if (player) {
                 // must be truthy but so what
                toast(<div>
                    <Card>
                        <Card.Body className="d-flex align-items-center">
                            <HouseIconComponent house={player.house} size={100}></HouseIconComponent>
                            <h2 className="d-inline ml-3" style={{ color: "white" }}>It&apos;s your turn!</h2>
                        </Card.Body>
                    </Card>
                </div>, {
                    autoClose: 4000,
                    toastId: "your-turn-toast",
                    pauseOnHover: false,
                    theme: "light",
                    transition: yourTurnToastAnimation
                });
            }
        } else {
            toast.dismiss("your-turn-toast");
        }
    }

    componentWillUnmount(): void {
        this.props.entireGame.onClientGameStateChange = null;
        this.props.entireGame.onGameStarted = null;
        if (this.setIntervalId >= 0) {
            window.clearInterval(this.setIntervalId);
            this.setIntervalId = -1;
        }
    }
}
