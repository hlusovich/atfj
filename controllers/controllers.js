import {CommonService} from "../services/common.service.js";
import {CommonHttpService} from "../dal/commonHttp.sepvice.js";
import {defaultStatusName} from "../constants/statusNameConstants.js";

export async function initControllers() {
    const commonService = new CommonService();

     const image = await CommonHttpService.downloadImageAsFile();
     const imageId = await CommonHttpService.uploadAttachment(image);
     const imageIdToJson = imageId.json();
     console.log(imageIdToJson)
     await CommonHttpService.attachImageToJetComment('4U4w4G49Ybxr', imageIdToJson);
    const fileLoader = document.getElementById('file-loader');
    const fileLoaderText = document.getElementById('file-loader-text');
    const tokenInput = document.getElementById('token-input');
    const selectOptionsContainer = document.getElementById('custom-options');
    const spinner = document.getElementById('spinner');
    const urlInput = document.getElementById('jet-brains-url-input');
    const submitButton = document.getElementById('submit-button');
    const migrateResult = document.getElementById('migrate-result');
    const migrateResultClose = document.getElementById('migrate-result-close');
    const migrateResultList = document.getElementById('migrate-result-list');

    window.addEventListener('click', function (e) {
        const select = document.querySelector('.select')
        if (!select.contains(e.target)) {
            select.classList.remove('open');
        }
    });

    document.querySelector('.select-wrapper').addEventListener('click', function () {
        this.querySelector('.select').classList.toggle('open');
    });

    urlInput.addEventListener('change', (input) => {
        commonService.url = input.currentTarget.value;
        commonService.asanaStatuses = CommonHttpService.getAsanaStatuses();
        tokenInput.disabled = !commonService.url;
    });

    fileLoader.addEventListener('change', async (input) => {
        fileLoaderText.innerText = input.target.files[0].name;
        commonService.issuesList = await commonService.readFile(input.target.files[0]);
    });


    tokenInput.addEventListener('change', async (input) => {
        commonService.token = input.target.value;

        toggleLoading();
        commonService.projects = await CommonHttpService.getProjects();

        toggleLoading();

        commonService.projects.forEach(project => {
            const option = document.createElement('span');
            option.classList.add('custom-option');
            option.innerText = project.name;
            option.setAttribute('data-value', project.id);
            selectOptionsContainer.append(option);
        });

        for (const option of document.querySelectorAll(".custom-option")) {
            option.addEventListener('click', function () {
                if (!this.classList.contains('selected')) {
                    const selectedOption = this.parentNode.querySelector('.custom-option.selected');

                    if (selectedOption) {
                        selectedOption.classList.remove('selected');
                    }

                    commonService.selectedProject = this.getAttribute('data-value');
                    this.classList.add('selected');
                    this.closest('.select').querySelector('.select__trigger span').textContent = this.textContent;
                }
            })
        }
    });

    submitButton.addEventListener('click', async () => {
        toggleLoading();
        const promises = [];
        const combinedData = await CommonHttpService.getAsanaCustomFieldsStatuses();
        commonService.asanaStatuses = combinedData[0];
        commonService.tags = combinedData[1];

        await CommonHttpService.createJetStatuses(commonService.asanaStatuses);
        const tagsPromises = [];
            commonService.tags.forEach( tag =>tagsPromises.push(CommonHttpService.createJetTags(tag)));

        if(commonService.tags) {
            await  Promise.all(tagsPromises);
        }

        commonService.jetStatuses = await CommonHttpService.getJetStatuses();

        commonService.issuesList.forEach(issue => {
            issue.status = commonService.jetStatuses.find(status => status.name === (issue.status || defaultStatusName)).id;
        })
        console.log( commonService.issuesList);
        commonService.issuesList.slice(0, 1).forEach((item) => {
            promises.push(CommonHttpService.createIssue(item));
        });

        const result = await Promise.allSettled(promises);
        const json = await result[0].value.json();

        migrateResultList.innerHTML = '';
        result.forEach((item, index) => {
            createResultItem(item, commonService.issuesList[index].name);
        });
        const comments = await CommonHttpService.getAsanaTaskComments(commonService.issuesList[0].taskId);

        for(let i = 0; i < comments.length; i++) {
            await CommonHttpService.addJetIssueComment(json.id, comments[i]);
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
        itemText.innerText = itemData.value.statusText;

        item.append(itemText);

        migrateResultList.append(item);
    }

    function toggleResultModal() {
        migrateResult.classList.toggle('hidden');
    }

}