/// <reference path="../../../typings/browser.d.ts" />
/// <reference path="../../../node_modules/vue-class-component/index.d.ts" />

import * as Vue from 'vue';
import * as VueRouter from 'vue-router';
import VueComponent from 'vue-class-component';
import * as $ from 'jquery';
import * as electron from 'electron';
import IpcRenderer = Electron.IpcRenderer;
declare var componentHandler: any;

Vue.use(VueRouter);
let appRouter: any = new VueRouter();
let ipcRenderer: IpcRenderer = electron.ipcRenderer;
let clipboard: Electron.Clipboard = electron.clipboard;

interface IConfig {
	version: number;
	channelUrl: string;
	readChat: boolean;
	readMessage: boolean;
	readBalloon: boolean;
	readAnnounce: boolean;
	readNickname: boolean;
	readLikes: boolean;
}

@VueComponent({
	template: `
		<div class="urlBar">
			<div class="urlText mdl-textfield mdl-js-textfield">
				<input class="mdl-textfield__input" type="text" placeholder="放送のURL" id="channelUrl" v-model="channelUrl" v-on:change="changeConfig">
				<label class="mdl-textfield__label" for="channelUrl"></label>
			</div>
			<button class="mdl-button mdl-js-button mdl-js-ripple-effect" v-on:click="onPaste"><i class="fa fa-clipboard"></i> 貼り付け</button>
			<button class="mdl-button mdl-js-button mdl-js-ripple-effect" v-on:click="inputUrl">OK</button>
			<label class="readChat mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="readChat">
				<input type="checkbox" id="readChat" class="mdl-checkbox__input" v-model="readChat" v-on:change="changeConfig">
				<span class="mdl-checkbox__label">読み上げ</span>
			</label>
		</div>

		<div class="mainTab mdl-tabs mdl-js-tabs mdl-js-ripple-effect">
			<div class="mainTabBar mdl-tabs__tab-bar">
				<a href="#broadcast-panel" class="mdl-tabs__tab is-active">放送</a>
				<a href="#settings-panel" class="mdl-tabs__tab">設定</a>
			</div>

			<div class="mdl-tabs__panel is-active" id="broadcast-panel">
				<webview v-el:webview plugins nodeintegration></webview>
			</div>
			<div class="mdl-tabs__panel" id="settings-panel">
				<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="readMessage">
					<input type="checkbox" id="readMessage" class="mdl-checkbox__input" v-model="readMessage" v-on:change="changeConfig">
					<span class="mdl-checkbox__label">ユーザーメッセージを読む</span>
				</label>
				<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="readBalloon">
					<input type="checkbox" id="readBalloon" class="mdl-checkbox__input" v-model="readBalloon" v-on:change="changeConfig">
					<span class="mdl-checkbox__label">星風船を読む</span>
				</label>
				<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="readAnnounce">
					<input type="checkbox" id="readAnnounce" class="mdl-checkbox__input" v-model="readAnnounce" v-on:change="changeConfig">
					<span class="mdl-checkbox__label">入場アナウンスなどを読む</span>
				</label>
				<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="readNickname">
					<input type="checkbox" id="readNickname" class="mdl-checkbox__input" v-model="readNickname" v-on:change="changeConfig">
					<span class="mdl-checkbox__label">ニックネームを読む</span>
				</label>
				<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="readLikes">
					<input type="checkbox" id="readLikes" class="mdl-checkbox__input" v-model="readLikes" v-on:change="changeConfig">
					<span class="mdl-checkbox__label">いいねを読む</span>
				</label>
			</div>
		</div>
		<div id="toastContainer" class="mdl-js-snackbar mdl-snackbar">
			<div class="mdl-snackbar__text"></div>
			<button class="mdl-snackbar__action" type="button"></button>
		</div>
	`,
})
class LoginView extends Vue {
	private channelUrl: string;
	private readChat: boolean;
	private readMessage: boolean;
	private readBalloon: boolean;
	private readAnnounce: boolean;
	private readNickname: boolean;
	private readLikes: boolean;
	public data(): any {
		return {
			channelUrl: '',
			readChat: false,
			readMessage: false,
			readBalloon: false,
			readAnnounce: false,
			readNickname: false,
			readLikes: false,
		};
	}
	public onPaste(): void {
		this.channelUrl = clipboard.readText("selection").trim();
	}
	public changeConfig(): void {
		let config: IConfig = {
			version: 1,
			channelUrl: this.channelUrl,
			readChat: this.readChat,
			readMessage: this.readMessage,
			readBalloon: this.readBalloon,
			readAnnounce: this.readAnnounce,
			readNickname: this.readNickname,
			readLikes: this.readLikes,
		};
		ipcRenderer.send("setConfig", JSON.stringify(config));
	}
	public inputUrl(): void {
		this.changeConfig();
		let webview: any = this.$els['webview'];
		webview.setAttribute("src", this.channelUrl);
	}
	public attached(): void {
		componentHandler.upgradeDom();
		ipcRenderer.on("getConfig", (e: any, arg: string) => {
			let config: IConfig = JSON.parse(arg);
			this.channelUrl = config.channelUrl;
			this.readChat = config.readChat;
			this.readMessage = config.readMessage;
			this.readBalloon = config.readBalloon;
			this.readAnnounce = config.readAnnounce;
			this.readNickname = config.readNickname;
			this.readLikes = config.readLikes;
			this.updateCheck(document.getElementById("readChat"), this.readChat);
			this.updateCheck(document.getElementById("readMessage"), this.readMessage);
			this.updateCheck(document.getElementById("readBalloon"), this.readBalloon);
			this.updateCheck(document.getElementById("readAnnounce"), this.readAnnounce);
			this.updateCheck(document.getElementById("readNickname"), this.readNickname);
			this.updateCheck(document.getElementById("readLikes"), this.readLikes);
		});
		ipcRenderer.on("error", (e: any, arg: string) => {
			let snackbarContainer: any = document.getElementById("toastContainer");
			if (snackbarContainer.MaterialSnackbar.queuedNotifications_.length === 0) {
				snackbarContainer.MaterialSnackbar.showSnackbar({
					message: arg,
					timeout: 5000,
				});
			}
		});
		ipcRenderer.send("getConfig");
		let webview: any = this.$els['webview'];
		webview.addEventListener('ipc-message', function(event: any) {
			ipcRenderer.send("message", event.channel);
		});
		webview.addEventListener("did-stop-loading", () => {
			// webview.openDevTools();
			let guestJs: string = `
function getLikes() {
	var likecnt = document.getElementById('likecnt');
	if (likecnt) {
		var result = parseInt(likecnt.textContent.replace(/[^0-9]/g, ""));
		return isNaN(result) ? 0 : result;
	} else {
		return 0;
	}
}
var savannaTalkIpcRenderer = require('electron').ipcRenderer;
var savannaTalkMessages = [];
var savannaTalkLikes = getLikes();
window.setInterval(function() {
	var iframe = document.getElementById('frameChat');
	var messages = [];
	var chatOutput = iframe.contentWindow.document.querySelector("#chatOutput");
	var children = chatOutput.children;
	for (var i = 1; i < children.length; ++i) { // starts from 1 to skip the first welcome message
		if (children.item(i).tagName.toLowerCase() === "dl") {
			var dd = children.item(i).querySelector("dd");
			var dta = children.item(i).querySelector("dt a");
			messages.push({
				type: "message",
				message: (dd === null) ? "コメントを読めません。" : dd.textContent,
				nickname: (dta === null) ? "ニックネームを読めません。" : dta.textContent,
			});
		} else if (children.item(i).getAttribute("class") === "balloon_area") {
			var text = children.item(i).querySelector(".bal_txt");
			var strong = children.item(i).querySelector("strong");
			if (text === null || strong === null) {
				messages.push({
					type: "balloon",
					message: "星風船を読めません。",
					nickname: "",
				});
			} else {
				messages.push({
					type: "balloon",
					message: text.textContent + ' ' + strong.textContent.replace(/\\(\\d+\\)$/, ""),
					nickname: "",
				});
			}
		} else if (children.item(i).getAttribute("class") === "run_area") {
			var box = children.item(i).querySelector(".box");
			messages.push({
				type: "announce",
				message: (box === null) ? "メッセージを読めません。" : box.textContent,
				nickname: "",
			});
		}
	}
	var newMessages = [];
	for (var i = savannaTalkMessages.length; i < messages.length; ++i) {
		newMessages.push(messages[i]);
	}
	var specialMessages = [];
	var newLikes = getLikes();
	if (savannaTalkLikes < newLikes) {
		savannaTalkLikes = newLikes;
		specialMessages.push({
			type: "likes",
			message: "Eねされました。",
			nickname: "",
		});
	}
	savannaTalkIpcRenderer.sendToHost(JSON.stringify(newMessages.concat(specialMessages)));
	savannaTalkMessages = savannaTalkMessages.concat(newMessages);
}, 200);
`;
			webview.executeJavaScript(guestJs);
		});
	}
	public detached(): void {
	}
	private updateCheck(element: HTMLElement, checked: boolean): void {
		(element.parentElement as any).MaterialCheckbox[checked ? "check" : "uncheck"]();
	}
}
@VueComponent({})
class App extends Vue {
}

appRouter.map({
	'/': {
		component: LoginView,
	},
});

$(function() {
	appRouter.start(App, '#content');
});
