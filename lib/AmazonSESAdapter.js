"use strict";

var _MailAdapter2 = require("parse-server/lib/Adapters/Email/MailAdapter");

var _amazonSesMailer = _interopRequireDefault(require("amazon-ses-mailer"));

var _lodash = _interopRequireDefault(require("lodash.template"));

var _co = _interopRequireDefault(require("co"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

/**
 * MailAdapter implementation used by the Parse Server to send
 * password reset and email verification emails though AmazonSES
 * @class
 */
var AmazonSESAdapter =
/*#__PURE__*/
function (_MailAdapter) {
  _inherits(AmazonSESAdapter, _MailAdapter);

  function AmazonSESAdapter() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, AmazonSESAdapter);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(AmazonSESAdapter).call(this, options));
    var accessKeyId = options.accessKeyId,
        secretAccessKey = options.secretAccessKey,
        region = options.region,
        fromAddress = options.fromAddress;

    if (!accessKeyId || !secretAccessKey || !region || !fromAddress) {
      throw new Error('AmazonSESAdapter requires valid fromAddress, accessKeyId, secretAccessKey, region.');
    }

    var _options$templates = options.templates,
        templates = _options$templates === void 0 ? {} : _options$templates;
    ['passwordResetEmail', 'verificationEmail'].forEach(function (key) {
      var _ref = templates[key] || {},
          subject = _ref.subject,
          pathPlainText = _ref.pathPlainText,
          callback = _ref.callback;

      if (typeof subject !== 'string' || typeof pathPlainText !== 'string') throw new Error('AmazonSESAdapter templates are not properly configured.');
      if (callback && typeof callback !== 'function') throw new Error('AmazonSESAdapter template callback is not a function.');
    });
    _this.ses = new _amazonSesMailer["default"](accessKeyId, secretAccessKey, region);
    _this.fromAddress = fromAddress;
    _this.templates = templates;
    return _this;
  }
  /**
   * Method to send emails via AmazonSESAdapter
   *
   * @param {object} options, options object with the following parameters:
   * @param {string} options.subject, email's subject
   * @param {string} options.link, to reset password or verify email address
   * @param {object} options.user, the Parse.User object
   * @param {string} options.pathPlainText, path to plain-text version of email template
   * @param {string} options.pathHtml, path to html version of email template
   * @returns {promise}
   */


  _createClass(AmazonSESAdapter, [{
    key: "_sendMail",
    value: function _sendMail(options) {
      var _this2 = this;

      var loadEmailTemplate = this.loadEmailTemplate;
      var message = {},
          templateVars = {},
          pathPlainText,
          pathHtml;

      if (options.templateName) {
        var templateName = options.templateName,
            subject = options.subject,
            fromAddress = options.fromAddress,
            recipient = options.recipient,
            variables = options.variables;
        var _template = this.templates[templateName];
        if (!_template) throw new Error("Could not find template with name ".concat(templateName));
        if (!subject && !_template.subject) throw new Error("Cannot send email with template ".concat(templateName, " without a subject"));
        if (!recipient) throw new Error("Cannot send email with template ".concat(templateName, " without a recipient"));
        pathPlainText = _template.pathPlainText;
        pathHtml = _template.pathHtml;
        templateVars = variables;
        message = {
          from: fromAddress || this.fromAddress,
          to: recipient,
          subject: subject || _template.subject
        };
      } else {
        var link = options.link,
            appName = options.appName,
            user = options.user,
            templateConfig = options.templateConfig;
        var callback = templateConfig.callback;
        var userVars;

        if (callback && typeof callback === 'function') {
          userVars = callback(user); // If custom user variables are not packaged in an object, ignore it

          var validUserVars = userVars && userVars.constructor && userVars.constructor.name === 'Object';
          userVars = validUserVars ? userVars : {};
        }

        pathPlainText = templateConfig.pathPlainText;
        pathHtml = templateConfig.pathHtml;
        templateVars = Object.assign({
          link: link,
          appName: appName,
          username: user.get('username'),
          email: user.get('email')
        }, userVars);
        message = {
          from: this.fromAddress,
          to: user.get('email'),
          subject: templateConfig.subject
        };
      }

      return (0, _co["default"])(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee() {
        var plainTextEmail, htmlEmail, compiled;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return loadEmailTemplate(pathPlainText);

              case 2:
                plainTextEmail = _context.sent;
                plainTextEmail = plainTextEmail.toString('utf8'); // Compile plain-text template

                compiled = (0, _lodash["default"])(plainTextEmail, {
                  interpolate: /{{([\s\S]+?)}}/g
                }); // Add processed text to the message object

                message.text = compiled(templateVars); // Load html version if available

                if (!pathHtml) {
                  _context.next = 12;
                  break;
                }

                _context.next = 9;
                return loadEmailTemplate(pathHtml);

              case 9:
                htmlEmail = _context.sent;
                // Compile html template
                compiled = (0, _lodash["default"])(htmlEmail, {
                  interpolate: /{{([\s\S]+?)}}/g
                }); // Add processed HTML to the message object

                message.html = compiled(templateVars);

              case 12:
                return _context.abrupt("return", {
                  from: message.from,
                  to: [message.to],
                  subject: message.subject,
                  body: {
                    text: message.text,
                    html: message.html
                  }
                });

              case 13:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      })).then(function (payload) {
        return new Promise(function (resolve, reject) {
          _this2.ses.send(payload, function (error, data) {
            if (error) reject(error);
            resolve(data);
          });
        });
      }, function (error) {
        console.error(error);
      });
    }
    /**
     * _sendMail wrapper to send an email with password reset link
     * @param {object} options, options object with the following parameters:
     * @param {string} options.link, to reset password or verify email address
     * @param {string} options.appName, the name of the parse-server app
     * @param {object} options.user, the Parse.User object
     * @returns {promise}
     */

  }, {
    key: "sendPasswordResetEmail",
    value: function sendPasswordResetEmail(_ref2) {
      var link = _ref2.link,
          appName = _ref2.appName,
          user = _ref2.user;
      return this._sendMail({
        link: link,
        appName: appName,
        user: user,
        templateConfig: this.templates.passwordResetEmail
      });
    }
    /**
     * _sendMail wrapper to send an email with an account verification link
     * @param {object} options, options object with the following parameters:
     * @param {string} options.link, to reset password or verify email address
     * @param {string} options.appName, the name of the parse-server app
     * @param {object} options.user, the Parse.User object
     * @returns {promise}
     */

  }, {
    key: "sendVerificationEmail",
    value: function sendVerificationEmail(_ref3) {
      var link = _ref3.link,
          appName = _ref3.appName,
          user = _ref3.user;
      return this._sendMail({
        link: link,
        appName: appName,
        user: user,
        templateConfig: this.templates.verificationEmail
      });
    }
    /**
     * _sendMail wrapper to send general purpose emails
     * @param {object} options, options object with the following parameters:
     * @param {object} options.templateName, name of template to be used
     * @param {object} options.subject, overrides the default value
     * @param {object} options.fromAddress, overrides the default from address
     * @param {object} options.recipient, email's recipient
     * @param {object} options.variables, an object whose property names represent
     *   template variables,vand whose values will replace the template variable
     *   placeholders
     * @returns {promise}
     */

  }, {
    key: "send",
    value: function send(_ref4) {
      var templateName = _ref4.templateName,
          subject = _ref4.subject,
          fromAddress = _ref4.fromAddress,
          recipient = _ref4.recipient,
          _ref4$variables = _ref4.variables,
          variables = _ref4$variables === void 0 ? {} : _ref4$variables;
      return this._sendMail({
        templateName: templateName,
        subject: subject,
        fromAddress: fromAddress,
        recipient: recipient,
        variables: variables
      });
    }
    /**
     * Simple Promise wrapper to asynchronously fetch the contents of a template.
     * @param {string} path
     * @returns {promise}
     */

  }, {
    key: "loadEmailTemplate",
    value: function loadEmailTemplate(path) {
      return new Promise(function (resolve, reject) {
        _fs["default"].readFile(path, function (err, data) {
          if (err) reject(err);
          resolve(data);
        });
      });
    }
  }]);

  return AmazonSESAdapter;
}(_MailAdapter2.MailAdapter);

module.exports = AmazonSESAdapter;