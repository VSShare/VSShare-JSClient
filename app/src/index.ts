import * as vsshare from './vsshare-client';

$(() => {
	const Url: string = "http://vsshare.net/signalr";
	const HubName: string = "listen";
	
	const Token: string = "xxxx";
	
	var client = new vsshare.VSShareClient(Url, HubName);
	client.startConnection(Token);
	
});

