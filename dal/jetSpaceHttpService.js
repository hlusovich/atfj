import {asanaHexConstants} from "../constants/asanaHexConstants.js";
import {defaultStatusName} from "../constants/statusNameConstants.js";
import {CommonMapper} from "../mappers/common.mapper.js";

export class JetSpaceHttpService {
    static async createIssue(item, jetCustomStatuses) {
        const customFields = [];
        jetCustomStatuses.forEach(status => {
            if(!item[status.name].trim()) {
                return;
            }
            if(status.type === 'ENUM') {

                customFields.push(
                    {
                        "fieldId": status.id,
                        "value": {
                            "className": "EnumCFInputValue",
                            "enumValueIdentifier": "name:" + item[status.name],
                        }
                    },
                );
            }

            if(status.type === 'STRING') {
                customFields.push(
                    {
                        "fieldId": status.id,
                        "value": {
                            "className": "StringCFValue",
                            "value": item[status.name],
                        }
                    },
                );
            }

        })
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
                "assignee": "username:" + 'mklusovich',
                customFields,
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

        return uploadResult;
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

    static async createCustomField(name, value) {
        const body = {
            name,
            "type": Array.isArray(value) ? "ENUM" : "STRING",
        }

        if(Array.isArray(value)) {
            body.parameters =    {
                "className": "EnumCFInputParameters",
                    "values": value.map(item => item.name)
            }
        }

        const result = await window.fetch(localStorage.getItem('jetBrainsUrl')+ '/api/http/custom-fields-v2/issueTracker:project:id:2K8XIK1rOOWU/fields', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        return await result.json();
    }
}