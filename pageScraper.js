const scraperObject = {
    // URL inicial do site a ser raspado
    url: 'http://books.toscrape.com',

    // Função de scraping assíncrona que recebe uma instância do navegador Puppeteer e a categoria desejada
    async scraper(browser, category) {
        // Abre uma nova página usando Puppeteer
        let page = await browser.newPage();

        // Exibe uma mensagem no console indicando a navegação para a URL inicial
        console.log(`Vamo nessa ${this.url}...`);

        // Navega até a página inicial
        await page.goto(this.url);

        // Seleciona a URL da categoria desejada
        let selectedCategory = await page.$$eval('.side_categories > ul > li > ul > li > a', (links, _category) => {
            // Mapeia os links para encontrar a URL da categoria desejada
            links = links.map(a => a.textContent.replace(/(\r\n\t|\n|\r|\t|^\s|\s$|\B\s|\s\B)/gm, "") === _category ? a : null);
            // Filtra para remover elementos nulos
            let link = links.filter(tx => tx !== null)[0];
            // Retorna a URL da categoria selecionada
            return link.href;
        }, category);

        // Navega até a categoria selecionada
        await page.goto(selectedCategory);

        // Inicializa um array para armazenar os dados raspados
        let scrapedData = [];

        // Função interna assíncrona para a raspagem da página atual
        async function scrapeCurrentPage() {
            // Aguarda até que o seletor necessário seja renderizado no DOM
            await page.waitForSelector('.page_inner');

            // Obtém os links dos livros da página
            let urls = await page.$$eval('section ol > li', links => {
                // Filtra os links para garantir que os livros estejam em estoque
                links = links.filter(link => link.querySelector('.instock.availability > i').textContent !== "In stock");
                // Extrai os links dos dados
                links = links.map(el => el.querySelector('h3 > a').href);
                // Retorna os links filtrados
                return links;
            });

            // Função que cria uma nova página, navega até o link do livro e extrai dados relevantes
            let pagePromise = (link) => new Promise(async (resolve, reject) => {
                let dataObj = {};
                let newPage = await browser.newPage();
                await newPage.goto(link);
                dataObj['bookTitle'] = await newPage.$eval('.product_main > h1', text => text.textContent);
                dataObj['bookPrice'] = await newPage.$eval('.price_color', text => text.textContent);
                dataObj['noAvailable'] = await newPage.$eval('.instock.availability', text => {
                    // Remove novas linhas e espaços de tabulação
                    text = text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "");
                    // Obtém o número de estoque disponível
                    let regexp = /^.*\((.*)\).*$/i;
                    let stockAvailable = regexp.exec(text)[1].split(' ')[0];
                    return stockAvailable;
                });
                dataObj['imageUrl'] = await newPage.$eval('#product_gallery img', img => img.src);
                dataObj['bookDescription'] = await newPage.$eval('#product_description', div => div.nextSibling.nextSibling.textContent);
                dataObj['upc'] = await newPage.$eval('.table.table-striped > tbody > tr > td', table => table.textContent);
                resolve(dataObj);
                // Fecha a nova página
                await newPage.close();
            });

            // Loop for...in que itera sobre os links dos livros, chamando a função pagePromise para cada link
            for (let link in urls) {
                let currentPageData = await pagePromise(urls[link]);
                // Adiciona os dados da página atual ao array de dados raspados
                scrapedData.push(currentPageData);
            }

            // Verifica se há um botão "Next" para a próxima página e, se existir, clica nele e chama recursivamente a função scrapeCurrentPage
            let nextButtonExist = false;
            try {
                const nextButton = await page.$eval('.next > a', a => a.textContent);
                nextButtonExist = true;
            } catch (err) {
                nextButtonExist = false;
            }
            if (nextButtonExist) {
                await page.click('.next > a');
                return scrapeCurrentPage(); // Chama esta função recursivamente
            }

            // Fecha a página
            await page.close();

            // Retorna os dados raspados
            return scrapedData;
        }

        // Chama a função interna de raspagem e armazena os dados resultantes na variável 'data'
        let data = await scrapeCurrentPage();

        // Exibe os dados no console
        console.log(data);

        // Retorna os dados coletados
        return data;
    }
}

// Exporta o objeto scraperObject para ser usado em outros arquivos
module.exports = scraperObject;
