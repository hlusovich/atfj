import {asanaHexConstants} from "../constants/asanaHexConstants.js";
import {defaultStatusName} from "../constants/statusNameConstants.js";
import {CommonMapper} from "../mappers/common.mapper.js";

export class JetSpaceHttpService {
    static async createIssue(item, jetCustomStatuses, jetTags, projectMembers) {
        const tag = jetTags.find(tag => tag.name === item.taskOrEpic);
        const projectMember = projectMembers.find(member => member.username === item.assigneeEmail.split('@')[0]);

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

        });

        const body = {
            "title": item.name,
            "description": item.notes,
            "dueDate": item.dueDate || null,

            "status": item.status,
        }

        if(projectMember) {
            body["assignee"] = "username:" + item.assigneeEmail.split('@')[0];
        }

        if(customFields.length) {
          body.customFields = customFields;
        }

        if(tag) {
            body.tags = [tag.id];
        }

        return await window.fetch(localStorage.getItem('jetBrainsUrl')+ '/api/http/projects/id:2K8XIK1rOOWU/planning/issues', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
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

    static async getAllHierarchicalTags(project) {
        const result = await window.fetch(`https://datamola.jetbrains.space/api/http/projects/id:${project}/planning/tags`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json'
            },
        });

        return await result.json();
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
        const result = await window.fetch(localStorage.getItem('jetBrainsUrl')+ '/api/http/projects/id:2K8XIK1rOOWU/planning/tags', {
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

    static async getProjectMembers(projectId) {
        const result = await window.fetch(`https://datamola.jetbrains.space/api/http/projects/id:${projectId}/access/member-profiles`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + 'eyJhbGciOiJSUzUxMiJ9.eyJzdWIiOiJvOWoxMjhGa2RhIiwiYXVkIjoiY2lyY2xldC13ZWItdWkiLCJvcmdEb21haW4iOiJkYXRhbW9sYSIsInNjb3BlIjoiKioiLCJuYW1lIjoibWtsdXNvdmljaCIsImlzcyI6Imh0dHBzOlwvXC9kYXRhbW9sYS5qZXRicmFpbnMuc3BhY2UiLCJwcmluY2lwYWxfdHlwZSI6IlVTRVIiLCJleHAiOjE2ODMwMjY1NDQsImlhdCI6MTY4MzAyNTk0NCwic2lkIjoiMk9HMTBINEhPTzdEIn0.T4_JcX8xG85Tz4qF6YAgzOHffgSI8xY8nHaB8EwotN0fnCn-aYjasGnbzRZxMqxIp6Y1zcUCSCYcUGVAfchaxmuBc6AMXyZhvK73-wVKVmOQX1RNu0D_yP4zl0kGk-ebr3ZomJUqW4MCQoGXqutHds4CM9DO2i2jvglr0XJ7bM8',
                'Accept': 'application/json'
            },
        });

        const json = await result.json();
        return json.data;
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
            });

        const json = await uploadResult.json();
        return json;
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