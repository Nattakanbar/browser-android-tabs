// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

cr.exportPath('print_preview');

/**
 * @enum {number}
 * @private
 */
print_preview.InvitationStoreLoadStatus = {
  IN_PROGRESS: 1,
  DONE: 2,
  FAILED: 3
};

cr.define('print_preview', function() {
  'use strict';

  class InvitationStore extends cr.EventTarget {
    /** Printer sharing invitations data store. */
    constructor() {
      super();

      /**
       * Maps user account to the list of invitations for this account.
       * @private {!Object<!Array<!print_preview.Invitation>>}
       */
      this.invitations_ = {};

      /**
       * Maps user account to the flag whether the invitations for this account
       * were successfully loaded.
       * @private {!Object<print_preview.InvitationStoreLoadStatus>}
       */
      this.loadStatus_ = {};

      /**
       * Event tracker used to track event listeners of the destination store.
       * @private {!EventTracker}
       */
      this.tracker_ = new EventTracker();

      /**
       * Used to fetch and process invitations.
       * @private {cloudprint.CloudPrintInterface}
       */
      this.cloudPrintInterface_ = null;

      /**
       * Invitation being processed now. Only one invitation can be processed at
       * a time.
       * @private {print_preview.Invitation}
       */
      this.invitationInProgress_ = null;
    }

    /**
     * @return {print_preview.Invitation} Currently processed invitation or
     *     {@code null}.
     */
    get invitationInProgress() {
      return this.invitationInProgress_;
    }

    /**
     * @param {string} account Account to filter invitations by.
     * @return {!Array<!print_preview.Invitation>} List of invitations for the
     *     {@code account}.
     */
    invitations(account) {
      return this.invitations_[account] || [];
    }

    /**
     * Sets the invitation store's Google Cloud Print interface.
     * @param {!cloudprint.CloudPrintInterface} cloudPrintInterface Interface
     *     to set.
     */
    setCloudPrintInterface(cloudPrintInterface) {
      assert(this.cloudPrintInterface_ == null);
      this.cloudPrintInterface_ = cloudPrintInterface;
      this.tracker_.add(
          this.cloudPrintInterface_.getEventTarget(),
          cloudprint.CloudPrintInterfaceEventType.INVITES_DONE,
          this.onCloudPrintInvitesDone_.bind(this));
      this.tracker_.add(
          this.cloudPrintInterface_.getEventTarget(),
          cloudprint.CloudPrintInterfaceEventType.INVITES_FAILED,
          this.onCloudPrintInvitesFailed_.bind(this));
      this.tracker_.add(
          this.cloudPrintInterface_.getEventTarget(),
          cloudprint.CloudPrintInterfaceEventType.PROCESS_INVITE_DONE,
          this.onCloudPrintProcessInviteDone_.bind(this));
    }

    /**
     * Initiates loading of cloud printer sharing invitations for the user
     * account given by |user|.
     * @param {string} user The user to load invitations for.
     */
    startLoadingInvitations(user) {
      if (!this.cloudPrintInterface_) {
        return;
      }
      if (this.loadStatus_.hasOwnProperty(user)) {
        if (this.loadStatus_[user] ==
            print_preview.InvitationStoreLoadStatus.DONE) {
          this.dispatchEvent(new CustomEvent(
              InvitationStore.EventType.INVITATION_SEARCH_DONE));
        }
        return;
      }

      this.loadStatus_[user] =
          print_preview.InvitationStoreLoadStatus.IN_PROGRESS;
      this.cloudPrintInterface_.invites(user);
    }

    /**
     * Accepts or rejects the {@code invitation}, based on {@code accept} value.
     * @param {!print_preview.Invitation} invitation Invitation to process.
     * @param {boolean} accept Whether to accept this invitation.
     */
    processInvitation(invitation, accept) {
      if (this.invitationInProgress_) {
        return;
      }
      this.invitationInProgress_ = invitation;
      this.cloudPrintInterface_.processInvite(invitation, accept);
    }

    /**
     * Removes processed invitation from the internal storage.
     * @param {!print_preview.Invitation} invitation Processed invitation.
     * @private
     */
    invitationProcessed_(invitation) {
      if (this.invitations_.hasOwnProperty(invitation.account)) {
        this.invitations_[invitation.account] =
            this.invitations_[invitation.account].filter(function(i) {
              return i != invitation;
            });
      }
      if (this.invitationInProgress_ == invitation) {
        this.invitationInProgress_ = null;
      }
    }

    /**
     * Called when printer sharing invitations are fetched.
     * @param {!CustomEvent} event Contains the list of invitations.
     * @private
     */
    onCloudPrintInvitesDone_(event) {
      const invitesDoneDetail =
          /** @type {!cloudprint.CloudPrintInterfaceInvitesDoneDetail} */ (
              event.detail);
      this.loadStatus_[invitesDoneDetail.user] =
          print_preview.InvitationStoreLoadStatus.DONE;
      this.invitations_[invitesDoneDetail.user] = invitesDoneDetail.invitations;

      this.dispatchEvent(
          new CustomEvent(InvitationStore.EventType.INVITATION_SEARCH_DONE));
    }

    /**
     * Called when printer sharing invitations fetch has failed.
     * @param {!CustomEvent} event
     * @private
     */
    onCloudPrintInvitesFailed_(event) {
      this.loadStatus_[/** @type {string} */ (event.detail)] =
          print_preview.InvitationStoreLoadStatus.FAILED;
    }

    /**
     * Called when printer sharing invitation was processed successfully.
     * @param {!CustomEvent} event Contains detailed information about the
     *     invite.
     * @private
     */
    onCloudPrintProcessInviteDone_(event) {
      this.invitationProcessed_(
          /** @type {!cloudprint.CloudPrintInterfaceProcessInviteDetail} */ (
              event.detail)
              .invitation);
      this.dispatchEvent(
          new CustomEvent(InvitationStore.EventType.INVITATION_PROCESSED));
    }
  }

  /**
   * Event types dispatched by the data store.
   * @enum {string}
   */
  InvitationStore.EventType = {
    INVITATION_PROCESSED: 'print_preview.InvitationStore.INVITATION_PROCESSED',
    INVITATION_SEARCH_DONE:
        'print_preview.InvitationStore.INVITATION_SEARCH_DONE'
  };

  // Export
  return {InvitationStore: InvitationStore};
});
