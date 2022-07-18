// A wrapper function returning an async iterator for a MessageList. Derived from
// https://webextension-api.thunderbird.net/en/91/how-to/messageLists.html
async function* iterateMessagePages(page) {
	for (let message of page.messages) {
		yield message;
	}

	while (page.id) {
		page = await messenger.messages.continueList(page.id);
		for (let message of page.messages) {
			yield message;
		}
	}
}

async function* walkList(page) {
	if (page.messages.length != 0) {
		yield page.messages;
	}

	while (page.id) {
		page = await browser.messages.continueList(page.id);

		yield page.messages;
	}
}

async function archiveOlderThan(folder, toDate) {
	const page = await browser.messages.query({
		folder: folder,
		toDate: toDate,
		unread: false,
		flagged: false
	});

	for await (const messages of walkList(page)) {
		const messageIds = messages.map(message => message.id);

		console.log("Archiving: accountid: " + folder.accountId + " Folder: " + folder.name + " count messages: " + messageIds.length);

		await browser.messages.archive(messageIds);
	}
}

async function autoArchive() {
	let accounts = await browser.accounts.list(true);
	let toDate = new Date();
	toDate.setMonth(toDate.getMonth() - 3);

	for await (const account of accounts) {
		if(account.type != "none"){
			console.log("accountId: " + account.id + " account: " + account.name + " type: " + account.type);

			for (const folder of account.folders){
				if(folder.type == 'sent' || folder.type == 'inbox'){
					console.log("folder: " + folder.name + " type: " + folder.type);

					archiveOlderThan(folder, toDate);
				}
			}
		}
	}
}

async function load() {
	setInterval(autoArchive, 1000 * 3600);

	autoArchive();
}

document.addEventListener("DOMContentLoaded", load);
