import {CsvHelper} from "../helpers/csv.helper.js";

export class CommonService {
    constructor(baseUrl) {
        this.tokenBase = 'Bearer ';
        this.baseUrl = baseUrl;
        this.fullToken = null;
        this.issuesList = null;
        this.projectsList = null;
        this.project = null;
        this.jetBrainsUrl = null;
        this.jetStatuses = null;
        this.asanaStatuses = null;
        this.tags = null;
    }

    set token(tokenString) {
        this.fullToken = this.tokenBase + tokenString;
    }

    set selectedProject(project) {
        this.project = project;
    }

    get selectedProject() {
        return this.project;
    }

    set projects(projects) {
        this.projectsList = projects;
    }

    get projects() {
        return this.projectsList;
    }

    get url() {
        return this.jetBrainsUrl;
    }

    set url(url) {
        return this.jetBrainsUrl = url;
    }

   readFile(file) {
        let reader = new FileReader();
        reader.readAsText(file);

        return new Promise((resolve) => {
            reader.onload = function() {
                resolve(CsvHelper.csvToArray(reader.result));
            };

            reader.onerror = function() {
                console.log(reader.error);
            };
        })


    }
}