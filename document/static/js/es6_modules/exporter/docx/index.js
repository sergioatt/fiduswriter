import {modelToEditor} from "../../editor/node-convert"
import {downloadFile} from "../download"
import {createSlug, getDatabasesIfNeeded} from "../tools"
import JSZip from "jszip"
import JSZipUtils from "jszip-utils"

import {DocxExporterCitations} from "./citations"
import {DocxExporterImages} from "./images"
import {DocxExporterRender} from "./render"
import {DocxExporterRichtext} from "./richtext"
import {DocxExporterXml} from "./xml"
import {DocxExporterRels} from "./rels"
import {DocxExporterFootnotes} from "./footnotes"

/*
Exporter to Microsoft Word.

This exporter is experimental.

TODO:
* equations (inline and figure)
*/

export class DocxExporter {
    constructor(doc, bibDB, imageDB) {
        let that = this
        this.doc = doc
        // We use the doc in the pm format as this is what we will be using
        // throughout the application in the future.
        this.pmDoc = modelToEditor(this.doc)
        this.template = false
        this.zip = false
        this.extraFiles = {}
        this.maxRelId = {}
        this.pmBib = false
        this.docTitle = this.pmDoc.child(0).textContent
        this.footnotes = new DocxExporterFootnotes(this)
        this.render = new DocxExporterRender(this)

        this.xml = new DocxExporterXml(this)

        this.rels = new DocxExporterRels(this, 'document')
        getDatabasesIfNeeded(this, doc, function() {
            that.images = new DocxExporterImages(that, that.imageDB, that.rels, that.pmDoc)
            that.citations = new DocxExporterCitations(that, that.bibDB, that.pmDoc)
            that.richtext = new DocxExporterRichtext(
                that,
                that.rels,
                that.citations,
                that.images
            )
            that.createFile()
        })
    }

    getTemplate() {
        let that = this
        return new window.Promise((resolve) => {
            JSZipUtils.getBinaryContent(
                staticUrl + 'docx/template.docx',
                function(err, template){
                    that.template = template
                    resolve()
                }
            )
        })
    }

    createFile() {
        let that = this
        this.citations.formatCitations()
        this.pmBib = this.citations.pmBib
        this.zip = new JSZip()

        this.getTemplate().then(() => {
                return that.zip.loadAsync(that.template)
            }).then(() => {
                return that.render.init()
            }).then(() => {
                return that.rels.init()
            }).then(() => {
                return that.images.init()
            }).then(() => {
                return that.footnotes.init()
            }).then(() => {
                that.render.getTagData()
                that.render.render()
                that.prepareAndDownload()
            })
    }

    prepareAndDownload() {
        let that = this

        this.xml.allToZip()

        for (let fileName in this.extraFiles) {
            this.zip.file(fileName, this.extraFiles[fileName])
        }
        this.zip.generateAsync({type:"blob"}).then(function(out){
            downloadFile(createSlug(that.docTitle)+'.docx', out)
        })
    }

}
