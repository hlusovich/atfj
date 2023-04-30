export class AsanaCommentsHelper {
    static defaultAttachmentDuration = 150;
    static getImageInDefaultAttachmentDuration (comment, attachments) {
        const commentCreatedAt = new Date(comment.createdAt).getSeconds();
        attachments.forEach(attachment => {
            const attachmentCreatedAt = new Date(attachment.created_at).getSeconds();
            const diff = (attachmentCreatedAt - commentCreatedAt);

            if( diff > 0 && diff < this.defaultAttachmentDuration ) {
                comment.text +=  `\n` + attachment.permanent_url;

            }
        })
    }
}