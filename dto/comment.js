export class CommentDto {
    constructor(json) {
        this.createdAt = json.created_at;
        this.userId = json.created_by.gid;
        this.userName = json.created_by.name;
        this.id = json.gid;
        this.text = json.text;
    }
}