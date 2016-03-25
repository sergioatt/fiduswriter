/**
 * @file Binds events on document overview page.
 * @copyright This file is part of <a href='http://www.fiduswriter.org'>Fidus Writer</a>.
 *
 * Copyright (C) 2013 Takuto Kojima, Johannes Wilm.
 *
 * @license This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <a href='http://www.gnu.org/licenses'>http://www.gnu.org/licenses</a>.
 *
 */

jQuery(document).ready(function () {
    jQuery(document).on('mousedown', '.delete-document', function () {
        var DocumentId = jQuery(this).attr('data-id');
        documentHelpers.deleteDocumentDialog([DocumentId]);
    });

    jQuery(document).on('mousedown', '.owned-by-user .rights', function () {
        var documentId = parseInt(jQuery(this).attr('data-id'));
        new accessrightsHelpers.DocumentAccessRightsDialog([documentId], window.theAccessRights, window.theTeamMembers);
    });

    jQuery(document).on('mousedown', '.revisions', function () {
        var documentId = parseInt(jQuery(this).attr('data-id'));
        new documentrevisionsHelpers.DocumentRevisionsDialog(documentId, theDocumentList, theUser, function (actionObject) {
            switch(actionObject.action) {
                case 'added-document':
                    theDocumentList.push(actionObject.doc);
                    documentHelpers.stopDocumentTable();
                    jQuery('#document-table tbody').append(
                        tmp_documents_list_item({
                            aDocument: actionObject.doc
                        }));
                    documentHelpers.startDocumentTable();
                    break;
                case 'deleted-revision':
                    actionObject.doc.revisions = _.reject(actionObject.doc.revisions, function(revision) {
                        return (revision.pk == actionObject.id)
                    })
                    if (actionObject.doc.revisions.length === 0) {
                        jQuery('#Text_' + actionObject.doc.id + ' .revisions').detach()
                    }
                    jQuery('tr.revision-' + actionObject.id).remove();
                    break;
            }

        });
    });

    //select all entries
    jQuery('#select-all-entry').bind('change', function () {
        var new_bool = false;
        if (jQuery(this).prop("checked"))
            new_bool = true;
        jQuery('.entry-select').not(':disabled').each(function () {
            this.checked = new_bool
        });
    });

    //open dropdown for selecting action
    $.addDropdownBox(jQuery('#select-action-dropdown-documents'), jQuery(
        '#action-selection-pulldown-documents'));

    //submit action for selected document
    jQuery('#action-selection-pulldown-documents li > span').bind('mousedown',
        function () {
            var action_name = jQuery(this).attr('data-action'),
                ids = [];
            if ('' == action_name || 'undefined' == typeof (action_name))
                return;
            jQuery('.entry-select:checked').not(':disabled').each(function () {
                if (theUser.id != jQuery(this).attr('data-owner') && (
                    action_name === 'delete' || action_name ===
                    'share')) {
                    var the_title = jQuery(this).parent().parent().parent()
                        .find(
                            '.doc-title').text()
                    the_title = $.trim(the_title).replace(/[\t\n]/g, '');
                    $.addAlert('error', gettext(
                        'You cannot delete or share: ') + the_title);
                    //return true;
                } else {
                    ids[ids.length] = parseInt(jQuery(this).attr(
                        'data-id'));
                }
            });
            if (0 == ids.length)
                return;
            switch (action_name) {
            case 'delete':
                documentHelpers.deleteDocumentDialog(ids);
                break;
            case 'share':
                new accessrightsHelpers.DocumentAccessRightsDialog(ids, window.theAccessRights, window.theTeamMembers);
                break;
            case 'epub':
                documentHelpers.getMissingDocumentListData(ids, function () {
                    for (i = 0; i < ids.length; i++) {
                        exporter.downloadEpub(_.findWhere(
                            theDocumentList, {
                                id: ids[i]
                            }), false);
                    }
                });
                break;
            case 'latex':
                documentHelpers.getMissingDocumentListData(ids, function () {
                    for (i = 0; i < ids.length; i++) {
                        exporter.downloadLatex(_.findWhere(
                            theDocumentList, {
                                id: ids[i]
                            }), false);
                    }
                });
                break;
            case 'html':
                documentHelpers.getMissingDocumentListData(ids, function () {
                    for (i = 0; i < ids.length; i++) {
                        exporter.downloadHtml(_.findWhere(
                            theDocumentList, {
                                id: ids[i]
                            }), false);
                    }
                });
                break;
            case 'native':
                documentHelpers.getMissingDocumentListData(ids, function () {
                    for (i = 0; i < ids.length; i++) {
                        exporter.downloadNative(_.findWhere(
                            theDocumentList, {
                                id: ids[i]
                            }), false);
                    }
                });
                break;
            case 'copy':
                documentHelpers.getMissingDocumentListData(ids, function () {
                    for (i = 0; i < ids.length; i++) {
                        exporter.savecopy(_.findWhere(theDocumentList, {
                            id: ids[i]
                        }), false, window.theUser, function (returnValue) {
                            var aDocument = returnValue.aDocument;
                            theDocumentList.push(aDocument);
                            documentHelpers.stopDocumentTable();
                            jQuery('#document-table tbody').append(
                                tmp_documents_list_item({
                                        aDocument: aDocument
                                    }));
                            documentHelpers.startDocumentTable();
                        });
                    }
                });
                break;
            }

        });

    //import a fidus filw
    jQuery('.import-fidus').bind('mousedown', documentHelpers.importFidus);
});
