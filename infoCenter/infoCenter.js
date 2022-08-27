
class InfoCenter {
    static async getInfoMessage(textChannel) {

        let pinnedMessages = null;
        
        await textChannel.messages.fetchPinned()
            .then( (messages) => { 
                    pinnedMessages = messages.filter(msg => msg.author.bot);
                })
            .catch(console.error);

        if (pinnedMessages.size > 0) {
            for (var [key, msg] of pinnedMessages.entries()) {
                if ( msg.content.startsWith("|info|") ) {
                    return msg;
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