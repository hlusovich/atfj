export class CommonHttpService {
    static async downloadImageAsFile(imgId) {
        const result = await fetch('https://app.asana.com/app/asana/-/get_asset?' + imgId.split('\n')[0],
        );
        const resultToBlob = await result.blob();
        const file = new File([resultToBlob], "asanaMigration");
        return file;
    }
}