/// <reference path="../../typings/signalr/signalr.d.ts" />
/// <reference path="../../typings/vsshare/typings/vsshare/vsshare.d.ts" />

'use strict';


import Room from './room';

enum SignalRConnectionStatus {
	Connecting = 0,
	Connected = 1,
	Reconnecting = 2,
	Disconnected = 3
};

enum VSShareStatus {
	Disconnected = 0,
	Connecting = 1,
	Connected = 2,
	Authorized = 3
}

export class VSShareClient {
	private _url: string;
	private _hubName: string;

	private _room: Room;

	private _connection: HubConnection;
	private _hub: HubProxy;

	private _status: VSShareStatus = VSShareStatus.Disconnected;
	private _connectionStatus: SignalRConnectionStatus = SignalRConnectionStatus.Disconnected;
	
	constructor(url: string, hubName: string) {
		this._url = url;
		this._hubName = hubName;
		this._room = new Room();
		window.addEventListener("resize", () => {this.refleshView(this._room)}, false);
	}

	startConnection(token: string) {
		this.disposeConnection();

		const self = this;
		this._connection = $.hubConnection(this._url);
		
		this._connection.stateChanged((status) => {
			self.changeStatus(<SignalRConnectionStatus>status.newState);
		});

		this._hub = this._connection.createHubProxy(this._hubName);
		
		// イベントの登録
		this._hub.on("UpdateRoomStatus", (item) => {
			self._room.updateRoomStatus(item);
		});
		this._hub.on("UpdateSessionInfo", (item) => {
			self._room.updateSessionInfo(item);
		});
		this._hub.on("AppendSession", (item) => {
			self._room.appendSession(item);
		});
		this._hub.on("RemoveSession", (item) => {
			self._room.removeSession(item);
		});
		this._hub.on("UpdateSessionContent", (item) => {
			self._room.updateSessionContent(item);
		});
		this._hub.on("UpdateSessionCursor", (item) => {
			self._room.updateSessionInfo(item);
		});
		
		this._connection.start().done(() => {
			// 認証を行う
			console.log(`Connected to ${self._hubName} on ${self._url}.`);
			self._status = VSShareStatus.Connected;
			self.authorize(token);
		}).fail((err) => {
			// ユーザーへ何らかの手段で通知
			console.error(`Failed to connect ${self._hubName} on ${self._url}.`);
			self.disposeConnection();
		});
	}

	private authorize(token: string) {
		const self = this;

		var item: AuthorizeListenerRequest = { "token": token };
		this._hub.invoke("Authorize", item).done((res) => {
			var response: AuthorizeListenerResponse = res;
			if (response && response.success) {
				// 認証成功
				self._status = VSShareStatus.Authorized;
				this._hub.invoke("GetSessionList").done((res) => {
					
				});
			} else {
				// エラー
				console.error(`Failed to authorize hub with token: ${token}`);
				self.disposeConnection();
			}
		}).fail((err) => {
			console.error("Failed to invoke authorize method");
			self.disposeConnection();
		});
	}

	private changeStatus(status: SignalRConnectionStatus) {
		switch (status) {
			case SignalRConnectionStatus.Disconnected:
				this._status = VSShareStatus.Disconnected; // この時だけは反映
				break;
		}
	}

	private disposeConnection() {
		// 終了処理
		if (this._connection) {
			this._connection.stop();
		}
	}

	dispose() {

	}
	
	private refleshView(room){
		room.updateViewSize();
	}
}
