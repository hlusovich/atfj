import {CommonService} from "../services/common.service.js";
import {defaultStatusName} from "../constants/statusNameConstants.js";
import {AsanaHttpService} from "../dal/asanaHttpService.js";
import {JetSpaceHttpService} from "../dal/jetSpaceHttpService.js";
import {CommonHttpService} from "../dal/commonHttp.sepvice.js";

export async function initControllers() {
    const commonService = new CommonService();
    const asanaHttpService = new AsanaHttpService();

    const fileLoader = document.getElementById('file-loader');
    const fileLoaderText = document.getElementById('file-loader-text');
    const selectJetBrainsOptionsContainer = document.getElementById('jet-brains-options');
    const selectAsanaOptionsContainer = document.getElementById('asana-project-options');
    const spinner = document.getElementById('spinner');
    const submitButton = document.getElementById('submit-button');
    const migrateResult = document.getElementById('migrate-result');
    const migrateResultClose = document.getElementById('migrate-result-close');
    const migrateResultList = document.getElementById('migrate-result-list');

    toggleLoading();
    commonService.jetSpaceProjects = await JetSpaceHttpService.getProjects();
    commonService.asanaProjects = await asanaHttpService.getAllWorkspaceProjects();

    toggleLoading();

    commonService.jetSpaceProjects.forEach(project => {
        const option = createSelectOption(project.name, project.id, 'jet-custom-option');
        selectJetBrainsOptionsContainer.append(option);
    });

    commonService.asanaProjects.forEach(project => {
        const option = createSelectOption(project.name, project.gid, 'asana-custom-option');
        selectAsanaOptionsContainer.append(option);
    });

    for (const option of document.querySelectorAll(".jet-custom-option")) {
        addOptionListener(option, (context) => commonService.selectedJetBrainsProject = context.getAttribute('data-value'));
    }

    for (const option of document.querySelectorAll(".asana-custom-option")) {

        addOptionListener(option, (context) => {
            commonService.selectedAsanaProject = context.getAttribute('data-value')
        });
    }


    window.addEventListener('click', function (e) {
        const jetSelect = document.getElementById('jet-projects-select');
        const asanaSelect = document.getElementById('asana-projects-select');

        if (!jetSelect.contains(e.target) && !asanaSelect.contains(e.target)) {
            jetSelect.classList.remove('open');
            asanaSelect.classList.remove('open');
        }

        if (jetSelect.contains(e.target)) {
            asanaSelect.classList.remove('open');
        }

        if (asanaSelect.contains(e.target)) {
            jetSelect.classList.remove('open');
        }
    });

    document.getElementById('jet-brains-projects').addEventListener('click', function () {
        this.querySelector('.select').classList.toggle('open');
    });

    document.getElementById('asana-projects').addEventListener('click', function () {
        this.querySelector('.select').classList.toggle('open');
    });


    fileLoader.addEventListener('change', async (input) => {
        fileLoaderText.innerText = input.target.files[0].name;
        commonService.issuesList = await commonService.readFile(input.target.files[0]);
    });

    submitButton.addEventListener('click', async () => {
        commonService.issuesList = commonService.issuesList.filter(issue => issue.name === 'Test task for jet transfer');

        // const projectMembers = await JetSpaceHttpService.getProjectMembers(commonService.selectedJetBrainsProject);

        const projectMembers = [];

        toggleLoading();
        const promises = [];
        const combinedData = await asanaHttpService.getAsanaCustomFieldsStatuses(commonService.selectedAsanaProject);
        commonService.asanaStatuses = combinedData[0];
        commonService.tags = combinedData[1];

        const customStatusesPromises = [];

        for (let i = 0; i < combinedData[2].length; i++) {
            const name = combinedData[2][i].name;
            const value = combinedData[2][i]['enum_options'] ?? combinedData[2][i].name;
            customStatusesPromises.push(JetSpaceHttpService.createCustomField(name, value))
        }

        const jetStatuses = await Promise.allSettled(customStatusesPromises);
        const mappedJetStatuses = jetStatuses.map(item => item.value);

        await JetSpaceHttpService.createJetStatuses(commonService.asanaStatuses);
        const tagsPromises = [];
        commonService.tags.forEach(tag => tagsPromises.push(JetSpaceHttpService.createJetTags(tag)));

        if (commonService.tags) {
            await Promise.all(tagsPromises);
        }

        commonService.jetStatuses = await JetSpaceHttpService.getJetStatuses();
        commonService.issuesList.forEach(issue => {
            issue.status = commonService.jetStatuses.find(status => status.name === (issue.status || defaultStatusName)).id;
        });

        const jetTags = await JetSpaceHttpService.getAllHierarchicalTags(commonService.selectedJetBrainsProject);

        commonService.issuesList.forEach((item) => {
            promises.push(JetSpaceHttpService.createIssue(item, mappedJetStatuses, jetTags.data, projectMembers));
        });
        const result = await Promise.allSettled(promises);

        migrateResultList.innerHTML = '';

        result.forEach((item, index) => {
            createResultItem(item, commonService.issuesList[index].name);
        });


        for (let i = 0; i < result.length; i++) {
            const comments = await asanaHttpService.getAsanaTaskComments(commonService.issuesList[i].taskId);
            const json = await result[i].value.json();
            for (let j = 0; j < comments.length; j++) {
                if(comments[j].text.startsWith('asset_id=')) {
                    const image = await CommonHttpService.downloadImageAsFile();
                    const imageId = await JetSpaceHttpService.uploadAttachment(image);
                    await JetSpaceHttpService.attachImageToJetComment(json.id, imageId);
                }
                else {
                    await JetSpaceHttpService.addJetIssueComment(json.id, comments[j]);
                }
            }
        }

        toggleLoading();
        toggleResultModal();
    });

    migrateResultClose.addEventListener('click', () => {
        toggleResultModal();
    });

    function toggleLoading() {
        spinner.classList.toggle('hidden');
    }

    function createResultItem(itemData, title) {
        const item = document.createElement('div');
        item.className = 'result-list-item';

        const itemTitle = document.createElement('div');
        itemTitle.className = 'result-list-item-title';
        const itemTitleText = document.createElement('div');
        itemTitleText.innerText = title;
        itemTitle.append(itemTitleText);
        const itemTitlePin = document.createElement('div');
        itemTitlePin.className = 'result-list-item-status';

        itemTitlePin.classList.add(itemData.status);

        itemTitle.append(itemTitlePin);

        item.append(itemTitle);

        const itemText = document.createElement('div');
        itemText.className = 'result-list-item-text';
        itemText.innerText = itemData.value?.statusText || itemData.value?.statusText;

        item.append(itemText);

        migrateResultList.append(item);
    }

    function toggleResultModal() {
        migrateResult.classList.toggle('hidden');
    }

    function createSelectOption(name, id, identifier) {
        const option = document.createElement('span');
        option.classList.add('custom-option');
        option.classList.add(identifier);
        option.innerText = name;
        option.setAttribute('data-value', id);

        return option;
    }

    function addOptionListener(option, callback) {
        option.addEventListener('click', function () {
            if (!this.classList.contains('selected')) {
                const selectedOption = this.parentNode.querySelector('.custom-option.selected');

                if (selectedOption) {
                    selectedOption.classList.remove('selected');
                }

                this.classList.add('selected');
                this.closest('.select').querySelector('.select__trigger span').textContent = this.textContent;
                callback(this);
            }
        })
    }

}