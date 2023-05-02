export class AsanaRow {
    constructor(json) {
        this.taskId = json['Task ID'];
        this.createdAt = json['Created At'];
        this.completedAt = json['Completed At'];
        this.lastModified = json['Last Modified'];
        this.name = json['Name'];
        this.sectionColumn = json['Section/Column'];
        this.assignee = json['Assignee'];
        this.assigneeEmail = json['Assignee Email'];
        this.startDate = json['Start Date'];
        this.dueDate = json['Due Date'];
        this.tags = json['Tags'];
        this.notes = json['Notes'];
        this.projects = json['Projects'];
        this.projectTask = json['Parent Task'];
        this.blockedBy = json['Blocked By (Dependencies)'];
        this.blocking = json['Blocking (Dependencies)'];
        this.businessArea = json['Business Area'];
        this.biDashboard = json['BI Dashboard'];
        this.taskOrEpic = json['Task or Epic'];
        this.status = json['Status -'];
        this.priority = json['Priority'];
        this.qaStatus = json['QA Status'];
        this.type = json['Type'];
        this.releaseDate = json['Release Date'];
        this.section = json['[EST_INT] Section'];
        this.checkBiDashBoard = json['Check BI dashboard'];
        this.epicStatus = json['Epic status'];
        this.uiDevStatus = json['UI dev Status'];
        this.estDays = json['EST, days'];
        this.creator = json['Creator'];
        this.execution = json['Execution'];
        this.note = json['Note'];

       const keys = Object.keys(json);

       keys.forEach(key => this[key] = json[key]);
    }
}
