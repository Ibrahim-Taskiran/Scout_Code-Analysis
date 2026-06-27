'use strict';

const { Notification } = require('electron');

/**
 * Send an OS notification.
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 */
function sendNotification(title, body) {
  if (!Notification.isSupported()) {
    console.warn('[NotificationService] OS notifications not supported on this platform.');
    return;
  }

  const notification = new Notification({
    title,
    body,
    silent: false,
  });

  notification.show();
}

/**
 * Send a formatted notification when analysis is complete.
 * @param {string} projectName - Name of the analyzed project
 * @param {number} score - Overall analysis score (0-10)
 */
function notifyAnalysisComplete(projectName, score) {
  const formattedScore = typeof score === 'number' ? score.toFixed(1) : '?';
  sendNotification(
    `${projectName} analysis complete ✅`,
    `Overall Score: ${formattedScore}/10`
  );
}

module.exports = {
  sendNotification,
  notifyAnalysisComplete,
};
