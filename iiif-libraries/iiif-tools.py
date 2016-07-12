import string, urlparse

## Adds coords to a IIIF URL ##
##TODO make better, use url parse
def getSectionURL(fullURL, X, Y, W, H):
    sectionStr = str(X)+','+str(Y)+','+str(W)+','+str(H)
    urlParts = string.split(fullURL, "full", 1)
    if len(urlParts) == 2:
        return urlParts[0]+sectionStr+urlParts[1]
    return ""
    
## Adds percentage to IIIF URL ##
##TODO make better, use url parse
def getPercentURL(fullURL, pct):
    #[https:
    urlParts = string.split(fullURL, "/")
    if len(urlParts) == 1:
        return #FIXME

## Get a MS number from the URL ##
def getMSNumber(URL):
    msIndex= URL.find('%')+3 #find start of MS number in URL
    pageIndex = URL.find('_')+1 #find start of folio number in URL

    ms_no = URL[msIndex:pageIndex-1].lstrip("0")
    return ms_no

## Get a folio (e.g. "12 V") from a URL ##
def getFolio(URL):
    pageIndex = URL.find('_')+1 #find start of folio number in URL
    rvIndex = URL.find('_', pageIndex)+1 #find _ starting from page index to get just before RV, then add 1
    page = URL[pageIndex:rvIndex-1].lstrip("0")
    rv = URL[rvIndex:rvIndex+1]
    if (rv == 'R' | rv == 'V'):
        page += " "+rv
    return page

def getJSONfromDruid(druid):
    url = "https://purl.stanford.edu/"+ druid + "/iiif/manifest.json"
    response = urllib.urlopen(url)
    return json.loads(response.read())

def numFolios(JSON):
    numImages = len(JSON['sequences'][0]['canvases'])


## Gets a single folio's info from the IIIF manifest JSON ##
## @param i Index of folio in canvas
## @return a list of the form [folio num, ms num, width, height, full url]
def getFolioData(JSON, i):
    canvas = data['sequences'][0]['canvases'][i]
    label = canvas['label'][:2]
    url = canvas['images'][0]['resource']['@id']
    type = url[-29:-27] #get TC or NC in URL
    if type == "TC" and (label == "f." or label == "p." or label == " f" or label == " p"):#only look at TC, and account for folios/pages not having dots after the label
        height = canvas['height']
        width = canvas['width']
        folio = getFolio(url)
        ms = getMSNumber(url)
        return [folio, ms, width, height, url]
    else: 
        return None
