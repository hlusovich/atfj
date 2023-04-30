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

    static async attachImageToJetComment(issue = '4U4w4G49Ybxr', img = 'mIUhm1RZdZ1') {
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

        const fullPath = localStorage.getItem('jetBrainsUrl') + path + '/' + file.name;

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

        // const uploadResult = await window.fetch(fullPath, {
        //     method: 'PUT',
        //     headers: {
        //         'Accept': 'application/json',
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         "fileName": file,
        //         "mediaType": "chat-image-attachment"
        //     })
        // });

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
        const result = await fetch('https://upload.wikimedia.org/wikipedia/commons/9/98/Pet_dog_fetching_sticks_in_Wales-3April2010.jpg',
        );
        const resultToBlob = await result.blob();
        const file = new File([resultToBlob], "asanaMigration");
        return file;
    }
}