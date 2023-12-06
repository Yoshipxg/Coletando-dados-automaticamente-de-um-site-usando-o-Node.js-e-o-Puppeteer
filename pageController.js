// Importa o módulo pageScraper que contém a função de raspagem
const pageScraper = require('./pageScraper');

// Importa o módulo 'fs' para manipulação de arquivos
const fs = require('fs');

// Função assíncrona que realiza a raspagem de diferentes conjuntos de livros
async function scrapeAll(browserInstance) {
    let browser;

    try {
        // Aguarda a resolução da instância do navegador
        browser = await browserInstance;

        // Inicializa um objeto para armazenar os dados raspados
        let scrapedData = {};

        // Chama a função de raspagem para diferentes conjuntos de livros
        scrapedData['Travel'] = await pageScraper.scraper(browser, 'Travel');
        scrapedData['HistoricalFiction'] = await pageScraper.scraper(browser, 'Historical Fiction');
        scrapedData['Mystery'] = await pageScraper.scraper(browser, 'Mystery');

        // Fecha a instância do navegador
        await browser.close();

        // Escreve os dados raspados em um arquivo JSON chamado "data.json"
        fs.writeFile("data.json", JSON.stringify(scrapedData), 'utf8', function(err) {
            if (err) {
                // Em caso de erro, exibe uma mensagem no console
                return console.log(err);
            }
            // Se bem-sucedido, exibe uma mensagem indicando que os dados foram raspados e salvos com sucesso
            console.log("The data has been scraped and saved successfully! View it at './data.json'");
        });
    } catch (err) {
        // Em caso de erro durante a execução da raspagem, exibe uma mensagem no console
        console.log("Could not resolve the browser instance => ", err);
    }
}

// Exporta uma função que recebe uma instância do navegador e chama a função scrapeAll
module.exports = (browserInstance) => scrapeAll(browserInstance);
