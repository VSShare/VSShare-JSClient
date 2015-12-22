/// <reference path="../../typings/jquery/jquery.d.ts" />
import * as vsshare from './vsshare-client';

$(() => {
	
	const Url: string = "http://vssharestg.azurewebsites.net/signalr";
	const HubName: string = "listen";
	
	const Token: string = "xxx";
	
	var client = new vsshare.VSShareClient(Url, HubName);
	client.startConnection(Token);
	
	// for debug
	window["_client"] = client;
});

