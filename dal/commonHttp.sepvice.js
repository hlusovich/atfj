import {CommonMapper} from "../mappers/common.mapper.js";
import {asanaHexConstants} from "../constants/asanaHexConstants.js";
import {commentIdentifier, defaultStatusName} from "../constants/statusNameConstants.js";
import {CommentDto} from "../dto/comment.js";
import {AsanaCommentsHelper} from "../helpers/asanaCommentsHelper.js";

export class CommonHttpService {
    static async createIssue(item) {
        return await window.fetch(localStorage.getItem('jetBrainsUrl')+ '/api/http/projects/id:2K8XIK1rOOWU/planning/issues', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "title": item.name,
                "description": item.notes,
                "dueDate": item.dueDate || null,
                "assignee": "username:" + item.assigneeEmail.split('@')[0],

                "status": item.status,
            })
        });
    }

    static async createJetStatuses(statuses) {
        const result = await window.fetch(localStorage.getItem('jetBrainsUrl')+ '/api/http/projects/id:2K8XIK1rOOWU/planning/issues/statuses', {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                statuses: [{
                    color: asanaHexConstants.white,
                    name: defaultStatusName,
                    resolved: false,
                }, ...statuses]
            })
        });

        return result;
    }

    static async addJetIssueComment(taskId, comment) {
        const result = await window.fetch(localStorage.getItem('jetBrainsUrl')+ '/api/http/chats/messages/send-message', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "channel": `issue:id:${taskId}`,
                "content": {
                    "className": "ChatMessage.Text",
                    "text": comment.text
                }
            })
        });

        return result;
    }

    static async attachImageToJetComment(issue = '4U4w4G49Ybxr', img = '3AxRsr3pVYNH') {
        const url = localStorage.getItem('jetBrainsUrl')  + '/api/http/chats/messages/send-message';
        console.log(url);
        const result = await window.fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "channel": `issue:id:${issue}`,
                "content": {
                    "className": "ChatMessage.Block",
                    "sections": []
                },
                "attachments": [
                    {
                        "className": "ImageAttachment",
                        "id": img,
                        "width": 1000,
                        "height": 1000
                    }
                ]
            })
        });

        return result;
    }

    static async createJetTags(tag) {
        const result = window.fetch(localStorage.getItem('jetBrainsUrl')+ '/api/http/projects/id:2K8XIK1rOOWU/planning/tags', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: [tag.name],
            })
        });

        return result;
    }

    static async uploadAttachment(file) {

        const result = await window.fetch(localStorage.getItem('jetBrainsUrl')+ '/api/http/uploads', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "storagePrefix": "attachment",
                "mediaType": "chat-image-attachment"
            })
        });
        const path = await result.json();

        const fullPath = localStorage.getItem('jetBrainsUrl') + path + '/' + "asanaMigration";

        let formData = new FormData();
        formData.append("fileName", file);
        formData.append("mediaType", "chat-image-attachment");

        const uploadResult = await window.fetch(fullPath,
            {
                body: formData,
                method: "PUT"
            }).then(uploadResult => {
            console.log(uploadResult);
        });

        return result;
    }

    static async getProjects() {
        const response = await window.fetch(localStorage.getItem('jetBrainsUrl')+ '/api/http/projects', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json'
            },
        });

        const responseData = await response.json();
        return CommonMapper.mapProjects(responseData);
    }

    static async getJetStatuses() {
        const result = await window.fetch(localStorage.getItem('jetBrainsUrl')+ '/api/http/projects/id:2K8XIK1rOOWU/planning/issues/statuses', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json'
            },
        });

        return await result.json();
    }

    static async getAsanaCustomFieldsStatuses() {
        const client = window.asana.Client.create().useAccessToken(localStorage.getItem('asanaToken'));
        const project = await client.projects.getProject('1202696820451940', {opt_pretty: true});
        const customFieldSettingsStatuses = project['custom_field_settings'].find(item => item['custom_field'].name.toLowerCase().includes('status'));
        const mappedStatuses = customFieldSettingsStatuses?.custom_field?.enum_options.map((item, index) => {
            return {
                color: asanaHexConstants[item.color],
                name: item.name,
                resolved: index === 0,
            }
        });
        const customFieldSettingsTags = project['custom_field_settings'].find(item => item['custom_field'].name.toLowerCase().includes('task'))?.custom_field?.enum_options;
        return [mappedStatuses, customFieldSettingsTags];
    }

    static async getAllWorkspaceProjects() {
        const client = window.asana.Client.create().useAccessToken(localStorage.getItem('asanaToken'));
        const projects = await client.projects.getProjectsForWorkspace("192993458000388", {opt_pretty: true}); //workspace id;
        console.log(projects);
    }

    static async getAsanaTaskComments(taskId) {
        // const response = await window.fetch(`https://app.asana.com/api/1.0/tasks/${taskId}/stories`, {
        //     method: 'GET',
        //     headers: {
        //         'Authorization': 'Bearer ' + localStorage.getItem('asanaToken'),
        //         'Accept': 'application/json'
        //     },
        // });

        const client = window.asana.Client.create().useAccessToken(localStorage.getItem('asanaToken'));
        const taskStories = await client.stories.getStoriesForTask(taskId, {opt_pretty: true, "type": "comment",});
        const comments = taskStories.data.filter(story => story.type === commentIdentifier).map(comment => new CommentDto(comment));

        const attachmentsObjsIds = await this.getAsanaAttachmentsForObject(taskId);
        const attachmentsPromises = [];
        attachmentsObjsIds.forEach(id => attachmentsPromises.push(this.getAsanaAttachments(id, taskId)));

        const attachements = await Promise.all(attachmentsPromises);

        comments.forEach(comment => {
            if (!comment.text) {
                AsanaCommentsHelper.getImageInDefaultAttachmentDuration(comment, attachements);
            }
        });
        return comments;
    }

    static async getAsanaAttachmentsForObject(taskId) {
        const client = window.asana.Client.create().useAccessToken(localStorage.getItem('asanaToken'));
        const attachmentsObjs = await client.attachments.getAttachmentsForObject({parent: taskId, opt_pretty: true});
        return attachmentsObjs.data.map(attachmentsObj => attachmentsObj.gid);
    }

    static async getAsanaAttachments(attachmentId, taskId) {
        const client = window.asana.Client.create().useAccessToken(localStorage.getItem('asanaToken'));
        const attachments = await client.attachments.getAttachment(attachmentId, {parent: taskId, opt_pretty: true});
        return attachments;
    }

    static async downloadImageAsFile() {
        const result = await fetch('data:image/jpeg;base64,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',
        );
        const resultToBlob = await result.blob();
        const file = new File([resultToBlob], "asanaMigration");
        return file;
    }
}