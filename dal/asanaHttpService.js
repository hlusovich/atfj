import {asanaHexConstants} from "../constants/asanaHexConstants.js";
import {commentIdentifier} from "../constants/statusNameConstants.js";
import {CommentDto} from "../dto/comment.js";
import {AsanaCommentsHelper} from "../helpers/asanaCommentsHelper.js";

export class AsanaHttpService {
    constructor() {
        this.client = window.asana.Client.create().useAccessToken(localStorage.getItem('asanaToken'));
    }
     async getAsanaAttachments(attachmentId, taskId) {
        const attachments = await this.client.attachments.getAttachment(attachmentId, {parent: taskId, opt_pretty: true});
        return attachments;
    }

     async getAsanaCustomFieldsStatuses(projectId) {
        const project = await this.client.projects.getProject(projectId, {opt_pretty: true});
        const customFieldSettingsStatuses = project['custom_field_settings'].find(item => item['custom_field'].name.toLowerCase().includes('status -'));
        const mappedStatuses = customFieldSettingsStatuses?.custom_field?.enum_options.map((item, index) => {
            return {
                color: asanaHexConstants[item.color],
                name: item.name,
                resolved: index === 0,
            }
        });
        const customFieldSettingsTags = project['custom_field_settings'].find(item => item['custom_field'].name.toLowerCase().includes('task'))?.custom_field?.enum_options;
        const customSettings = project['custom_field_settings'].filter(item => !item['custom_field'].name.toLowerCase().includes('task') &&  !item['custom_field'].name.toLowerCase().includes('status -'));
        const mappedCustomSettings = customSettings.map(item => item['custom_field'] );
        return [mappedStatuses, customFieldSettingsTags, mappedCustomSettings];
    }

     async getAllWorkspaceProjects() {
        const projects = await this.client.projects.getProjectsForWorkspace(localStorage.getItem('asanaWorkSpace'), {opt_pretty: true});
        return projects.data;
    }

     async getAsanaTaskComments(taskId) {
        const taskStories = await this.client.stories.getStoriesForTask(taskId, {opt_pretty: true, "type": "comment",});
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

     async getAsanaAttachmentsForObject(taskId) {
        const attachmentsObjs = await this.client.attachments.getAttachmentsForObject({parent: taskId, opt_pretty: true});
        return attachmentsObjs.data.map(attachmentsObj => attachmentsObj.gid);
    }

     async getAsanaAttachments(attachmentId, taskId) {
        const attachments = await this.client.attachments.getAttachment(attachmentId, {parent: taskId, opt_pretty: true});
        return attachments;
    }
}