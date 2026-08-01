
class InfoCenter {
    static async getInfoMessage(textChannel) {

        let pinnedMessages = null;
        
        await textChannel.messages.fetchPins()
            .then( (messages) => {
                    pinnedMessages = messages.items.filter(msg => msg.message.author.bot);
                })
            .catch(console.error);

        if (pinnedMessages.length > 0) {
            for (let i = 0; i < pinnedMessages.length; i++) {
                let msg = pinnedMessages[i];
                if ( msg.message.content.startsWith("|info|") ) {
                    return msg.message;
                }
            }
        }

        return await textChannel.send({
            content: "|info|\n"
        })
        .then( infoMsg => infoMsg.pin() )
        .catch( err => console.log("Can't send message ...") );
    }
}

module.exports = {
    InfoCenter : InfoCenter
}