const MICROSERVICE1_URL = "http://192.168.65.44:50001";
const MICROSERVICE2_URL = "http://localhost:50002/Word2Vec";
const MICROSERVICE3_URL = "http://localhost:50003/EasyOCR_BERT";
const MICROSERVICE4_URL = "http://localhost:50004/predict";

async function sendToMicroservice(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

async function sendToMicroservice2(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: data
  });
  return response.text();
}

async function sendToMicroservice3(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.text();
}


async function checkAdSecurity(tabId, url) {
  try {
    console.log("IN")
    // Envoyer l'URL au microservice 1 pour récupérer les images de pubs
    // let result_analyzer = await sendToMicroservice2(MICROSERVICE1_URL, url );
    let result_analyzer = await sendToMicroservice2(MICROSERVICE1_URL, url );
    console.log(result_analyzer)
    result_analyzer = parseInt(result_analyzer);
    console.log(result_analyzer)
    //result_analyzer = 1;
    // let result_analyzer = 1;

    // Envoyer l'URL au microservice 2 pour la convertir en vecteur
    let urlVector = await sendToMicroservice(MICROSERVICE2_URL, { url });
    urlVector = urlVector['processed_data']
    console.log(urlVector)



    let result_model = 0; //non analyse

    let imageVectorDataset = await sendToMicroservice(MICROSERVICE3_URL, { screenshots_folder : "go" }); 
    imageVectorDataset = imageVectorDataset['processed_data']
    console.log(imageVectorDataset)
    result_model = 1; //Pas de malvertising detecte (pour l'instant)


    const prediction = await sendToMicroservice(MICROSERVICE4_URL, {
      m2 : urlVector,
      m3 : imageVectorDataset
    });
    console.log("prediction = " + prediction['processed_data'])
    if (prediction['processed_data'] == "-1") {
      result_model = -1; //Malvertising detecte
    }


    if (result_model + result_analyzer <= 0) {
      showNotification("Alerte Malvertising", "Malvertising détecté : la page n'est pas sécurisée.")
    }
    else {
        showNotification("Sécurité des publicités", "La page contient des publicités, mais elles sont sécurisées.");
    }
  } catch (error) {
    console.error("Error checking ad security:", error);
  }
}

function showNotification(title, message) {
  browser.notifications.create({
    "type": "basic",
    "iconUrl": "Logo.jpeg", 
    "title": title,
    "message": message
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    checkAdSecurity(tabId, tab.url);
  }
});