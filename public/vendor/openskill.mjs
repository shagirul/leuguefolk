// OpenSkill 5.0.1 (MIT). Rebuild with npm run build:ratings. See openskill.LICENSE.txt.
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@stdlib/math-base-assert-is-nan/lib/main.js
var require_main = __commonJS({
  "node_modules/@stdlib/math-base-assert-is-nan/lib/main.js"(exports, module) {
    "use strict";
    function isnan(x) {
      return x !== x;
    }
    module.exports = isnan;
  }
});

// node_modules/@stdlib/math-base-assert-is-nan/lib/index.js
var require_lib = __commonJS({
  "node_modules/@stdlib/math-base-assert-is-nan/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main();
    module.exports = main;
  }
});

// node_modules/@stdlib/math-base-special-floor/lib/main.js
var require_main2 = __commonJS({
  "node_modules/@stdlib/math-base-special-floor/lib/main.js"(exports, module) {
    "use strict";
    var floor = Math.floor;
    module.exports = floor;
  }
});

// node_modules/@stdlib/math-base-special-floor/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/@stdlib/math-base-special-floor/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main2();
    module.exports = main;
  }
});

// node_modules/@stdlib/math-base-special-ceil/lib/main.js
var require_main3 = __commonJS({
  "node_modules/@stdlib/math-base-special-ceil/lib/main.js"(exports, module) {
    "use strict";
    var ceil = Math.ceil;
    module.exports = ceil;
  }
});

// node_modules/@stdlib/math-base-special-ceil/lib/index.js
var require_lib3 = __commonJS({
  "node_modules/@stdlib/math-base-special-ceil/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main3();
    module.exports = main;
  }
});

// node_modules/@stdlib/math-base-special-trunc/lib/main.js
var require_main4 = __commonJS({
  "node_modules/@stdlib/math-base-special-trunc/lib/main.js"(exports, module) {
    "use strict";
    var floor = require_lib2();
    var ceil = require_lib3();
    function trunc(x) {
      if (x < 0) {
        return ceil(x);
      }
      return floor(x);
    }
    module.exports = trunc;
  }
});

// node_modules/@stdlib/math-base-special-trunc/lib/index.js
var require_lib4 = __commonJS({
  "node_modules/@stdlib/math-base-special-trunc/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main4();
    module.exports = main;
  }
});

// node_modules/@stdlib/number-ctor/lib/main.js
var require_main5 = __commonJS({
  "node_modules/@stdlib/number-ctor/lib/main.js"(exports, module) {
    "use strict";
    module.exports = Number;
  }
});

// node_modules/@stdlib/number-ctor/lib/index.js
var require_lib5 = __commonJS({
  "node_modules/@stdlib/number-ctor/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main5();
    module.exports = main;
  }
});

// node_modules/@stdlib/constants-float64-ninf/lib/index.js
var require_lib6 = __commonJS({
  "node_modules/@stdlib/constants-float64-ninf/lib/index.js"(exports, module) {
    "use strict";
    var Number2 = require_lib5();
    var FLOAT64_NINF = Number2.NEGATIVE_INFINITY;
    module.exports = FLOAT64_NINF;
  }
});

// node_modules/@stdlib/constants-float64-pinf/lib/index.js
var require_lib7 = __commonJS({
  "node_modules/@stdlib/constants-float64-pinf/lib/index.js"(exports, module) {
    "use strict";
    var FLOAT64_PINF = Number.POSITIVE_INFINITY;
    module.exports = FLOAT64_PINF;
  }
});

// node_modules/@stdlib/constants-float64-exponent-bias/lib/index.js
var require_lib8 = __commonJS({
  "node_modules/@stdlib/constants-float64-exponent-bias/lib/index.js"(exports, module) {
    "use strict";
    var FLOAT64_EXPONENT_BIAS = 1023 | 0;
    module.exports = FLOAT64_EXPONENT_BIAS;
  }
});

// node_modules/@stdlib/constants-float64-max-base2-exponent/lib/index.js
var require_lib9 = __commonJS({
  "node_modules/@stdlib/constants-float64-max-base2-exponent/lib/index.js"(exports, module) {
    "use strict";
    var FLOAT64_MAX_BASE2_EXPONENT = 1023 | 0;
    module.exports = FLOAT64_MAX_BASE2_EXPONENT;
  }
});

// node_modules/@stdlib/constants-float64-max-base2-exponent-subnormal/lib/index.js
var require_lib10 = __commonJS({
  "node_modules/@stdlib/constants-float64-max-base2-exponent-subnormal/lib/index.js"(exports, module) {
    "use strict";
    var FLOAT64_MAX_BASE2_EXPONENT_SUBNORMAL = -1023 | 0;
    module.exports = FLOAT64_MAX_BASE2_EXPONENT_SUBNORMAL;
  }
});

// node_modules/@stdlib/constants-float64-min-base2-exponent-subnormal/lib/index.js
var require_lib11 = __commonJS({
  "node_modules/@stdlib/constants-float64-min-base2-exponent-subnormal/lib/index.js"(exports, module) {
    "use strict";
    var FLOAT64_MIN_BASE2_EXPONENT_SUBNORMAL = -1074 | 0;
    module.exports = FLOAT64_MIN_BASE2_EXPONENT_SUBNORMAL;
  }
});

// node_modules/@stdlib/math-base-assert-is-infinite/lib/main.js
var require_main6 = __commonJS({
  "node_modules/@stdlib/math-base-assert-is-infinite/lib/main.js"(exports, module) {
    "use strict";
    var PINF = require_lib7();
    var NINF = require_lib6();
    function isInfinite(x) {
      return x === PINF || x === NINF;
    }
    module.exports = isInfinite;
  }
});

// node_modules/@stdlib/math-base-assert-is-infinite/lib/index.js
var require_lib12 = __commonJS({
  "node_modules/@stdlib/math-base-assert-is-infinite/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main6();
    module.exports = main;
  }
});

// node_modules/@stdlib/constants-float64-high-word-sign-mask/lib/index.js
var require_lib13 = __commonJS({
  "node_modules/@stdlib/constants-float64-high-word-sign-mask/lib/index.js"(exports, module) {
    "use strict";
    var FLOAT64_HIGH_WORD_SIGN_MASK = 2147483648 >>> 0;
    module.exports = FLOAT64_HIGH_WORD_SIGN_MASK;
  }
});

// node_modules/@stdlib/constants-float64-high-word-abs-mask/lib/index.js
var require_lib14 = __commonJS({
  "node_modules/@stdlib/constants-float64-high-word-abs-mask/lib/index.js"(exports, module) {
    "use strict";
    var FLOAT64_HIGH_WORD_ABS_MASK = 2147483647 >>> 0;
    module.exports = FLOAT64_HIGH_WORD_ABS_MASK;
  }
});

// node_modules/@stdlib/utils-define-property/lib/define_property.js
var require_define_property = __commonJS({
  "node_modules/@stdlib/utils-define-property/lib/define_property.js"(exports, module) {
    "use strict";
    var main = typeof Object.defineProperty === "function" ? Object.defineProperty : null;
    module.exports = main;
  }
});

// node_modules/@stdlib/utils-define-property/lib/has_define_property_support.js
var require_has_define_property_support = __commonJS({
  "node_modules/@stdlib/utils-define-property/lib/has_define_property_support.js"(exports, module) {
    "use strict";
    var defineProperty = require_define_property();
    function hasDefinePropertySupport() {
      try {
        defineProperty({}, "x", {});
        return true;
      } catch (err) {
        return false;
      }
    }
    module.exports = hasDefinePropertySupport;
  }
});

// node_modules/@stdlib/utils-define-property/lib/builtin.js
var require_builtin = __commonJS({
  "node_modules/@stdlib/utils-define-property/lib/builtin.js"(exports, module) {
    "use strict";
    var defineProperty = Object.defineProperty;
    module.exports = defineProperty;
  }
});

// node_modules/@stdlib/string-base-format-interpolate/lib/is_number.js
var require_is_number = __commonJS({
  "node_modules/@stdlib/string-base-format-interpolate/lib/is_number.js"(exports, module) {
    "use strict";
    function isNumber(value) {
      return typeof value === "number";
    }
    module.exports = isNumber;
  }
});

// node_modules/@stdlib/string-base-format-interpolate/lib/zero_pad.js
var require_zero_pad = __commonJS({
  "node_modules/@stdlib/string-base-format-interpolate/lib/zero_pad.js"(exports, module) {
    "use strict";
    function startsWithMinus(str) {
      return str[0] === "-";
    }
    function zeros(n) {
      var out = "";
      var i;
      for (i = 0; i < n; i++) {
        out += "0";
      }
      return out;
    }
    function zeroPad(str, width, right) {
      var negative = false;
      var pad = width - str.length;
      if (pad < 0) {
        return str;
      }
      if (startsWithMinus(str)) {
        negative = true;
        str = str.substr(1);
      }
      str = right ? str + zeros(pad) : zeros(pad) + str;
      if (negative) {
        str = "-" + str;
      }
      return str;
    }
    module.exports = zeroPad;
  }
});

// node_modules/@stdlib/string-base-format-interpolate/lib/format_integer.js
var require_format_integer = __commonJS({
  "node_modules/@stdlib/string-base-format-interpolate/lib/format_integer.js"(exports, module) {
    "use strict";
    var isNumber = require_is_number();
    var zeroPad = require_zero_pad();
    var lowercase = String.prototype.toLowerCase;
    var uppercase = String.prototype.toUpperCase;
    function formatInteger(token) {
      var base;
      var out;
      var i;
      switch (token.specifier) {
        case "b":
          base = 2;
          break;
        case "o":
          base = 8;
          break;
        case "x":
        case "X":
          base = 16;
          break;
        case "d":
        case "i":
        case "u":
        default:
          base = 10;
          break;
      }
      out = token.arg;
      i = parseInt(out, 10);
      if (!isFinite(i)) {
        if (!isNumber(out)) {
          throw new Error("invalid integer. Value: " + out);
        }
        i = 0;
      }
      if (i < 0 && (token.specifier === "u" || base !== 10)) {
        i = 4294967295 + i + 1;
      }
      if (i < 0) {
        out = (-i).toString(base);
        if (token.precision) {
          out = zeroPad(out, token.precision, token.padRight);
        }
        out = "-" + out;
      } else {
        out = i.toString(base);
        if (!i && !token.precision) {
          out = "";
        } else if (token.precision) {
          out = zeroPad(out, token.precision, token.padRight);
        }
        if (token.sign) {
          out = token.sign + out;
        }
      }
      if (base === 16) {
        if (token.alternate) {
          out = "0x" + out;
        }
        out = token.specifier === uppercase.call(token.specifier) ? uppercase.call(out) : lowercase.call(out);
      }
      if (base === 8) {
        if (token.alternate && out.charAt(0) !== "0") {
          out = "0" + out;
        }
      }
      return out;
    }
    module.exports = formatInteger;
  }
});

// node_modules/@stdlib/string-base-format-interpolate/lib/is_string.js
var require_is_string = __commonJS({
  "node_modules/@stdlib/string-base-format-interpolate/lib/is_string.js"(exports, module) {
    "use strict";
    function isString(value) {
      return typeof value === "string";
    }
    module.exports = isString;
  }
});

// node_modules/@stdlib/string-base-format-interpolate/lib/format_double.js
var require_format_double = __commonJS({
  "node_modules/@stdlib/string-base-format-interpolate/lib/format_double.js"(exports, module) {
    "use strict";
    var abs = Math.abs;
    var lowercase = String.prototype.toLowerCase;
    var uppercase = String.prototype.toUpperCase;
    var replace = String.prototype.replace;
    var RE_EXP_POS_DIGITS = /e\+(\d)$/;
    var RE_EXP_NEG_DIGITS = /e-(\d)$/;
    var RE_ONLY_DIGITS = /^(\d+)$/;
    var RE_DIGITS_BEFORE_EXP = /^(\d+)e/;
    var RE_TRAILING_PERIOD_ZERO = /\.0$/;
    var RE_PERIOD_ZERO_EXP = /\.0*e/;
    var RE_ZERO_BEFORE_EXP = /(\..*[^0])0*e/;
    function formatDouble(f, token) {
      var digits;
      var out;
      switch (token.specifier) {
        case "e":
        case "E":
          out = f.toExponential(token.precision);
          break;
        case "f":
        case "F":
          out = f.toFixed(token.precision);
          break;
        case "g":
        case "G":
          if (abs(f) < 1e-4) {
            digits = token.precision;
            if (digits > 0) {
              digits -= 1;
            }
            out = f.toExponential(digits);
          } else {
            out = f.toPrecision(token.precision);
          }
          if (!token.alternate) {
            out = replace.call(out, RE_ZERO_BEFORE_EXP, "$1e");
            out = replace.call(out, RE_PERIOD_ZERO_EXP, "e");
            out = replace.call(out, RE_TRAILING_PERIOD_ZERO, "");
          }
          break;
        default:
          throw new Error("invalid double notation. Value: " + token.specifier);
      }
      out = replace.call(out, RE_EXP_POS_DIGITS, "e+0$1");
      out = replace.call(out, RE_EXP_NEG_DIGITS, "e-0$1");
      if (token.alternate) {
        out = replace.call(out, RE_ONLY_DIGITS, "$1.");
        out = replace.call(out, RE_DIGITS_BEFORE_EXP, "$1.e");
      }
      if (f >= 0 && token.sign) {
        out = token.sign + out;
      }
      out = token.specifier === uppercase.call(token.specifier) ? uppercase.call(out) : lowercase.call(out);
      return out;
    }
    module.exports = formatDouble;
  }
});

// node_modules/@stdlib/string-base-format-interpolate/lib/space_pad.js
var require_space_pad = __commonJS({
  "node_modules/@stdlib/string-base-format-interpolate/lib/space_pad.js"(exports, module) {
    "use strict";
    function spaces(n) {
      var out = "";
      var i;
      for (i = 0; i < n; i++) {
        out += " ";
      }
      return out;
    }
    function spacePad(str, width, right) {
      var pad = width - str.length;
      if (pad < 0) {
        return str;
      }
      str = right ? str + spaces(pad) : spaces(pad) + str;
      return str;
    }
    module.exports = spacePad;
  }
});

// node_modules/@stdlib/string-base-format-interpolate/lib/main.js
var require_main7 = __commonJS({
  "node_modules/@stdlib/string-base-format-interpolate/lib/main.js"(exports, module) {
    "use strict";
    var formatInteger = require_format_integer();
    var isString = require_is_string();
    var isNumber = require_is_number();
    var formatDouble = require_format_double();
    var spacePad = require_space_pad();
    var zeroPad = require_zero_pad();
    var fromCharCode = String.fromCharCode;
    var isArray = Array.isArray;
    function isnan(value) {
      return value !== value;
    }
    function initialize(token) {
      var out = {};
      out.specifier = token.specifier;
      out.precision = token.precision === void 0 ? 1 : token.precision;
      out.width = token.width;
      out.flags = token.flags || "";
      out.mapping = token.mapping;
      return out;
    }
    function formatInterpolate(tokens) {
      var hasPeriod;
      var flags;
      var token;
      var flag;
      var num;
      var out;
      var pos;
      var f;
      var i;
      var j;
      if (!isArray(tokens)) {
        throw new TypeError("invalid argument. First argument must be an array. Value: `" + tokens + "`.");
      }
      out = "";
      pos = 1;
      for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        if (isString(token)) {
          out += token;
        } else {
          hasPeriod = token.precision !== void 0;
          token = initialize(token);
          if (!token.specifier) {
            throw new TypeError("invalid argument. Token is missing `specifier` property. Index: `" + i + "`. Value: `" + token + "`.");
          }
          if (token.mapping) {
            pos = token.mapping;
          }
          flags = token.flags;
          for (j = 0; j < flags.length; j++) {
            flag = flags.charAt(j);
            switch (flag) {
              case " ":
                token.sign = " ";
                break;
              case "+":
                token.sign = "+";
                break;
              case "-":
                token.padRight = true;
                token.padZeros = false;
                break;
              case "0":
                token.padZeros = flags.indexOf("-") < 0;
                break;
              case "#":
                token.alternate = true;
                break;
              default:
                throw new Error("invalid flag: " + flag);
            }
          }
          if (token.width === "*") {
            token.width = parseInt(arguments[pos], 10);
            pos += 1;
            if (isnan(token.width)) {
              throw new TypeError("the argument for * width at position " + pos + " is not a number. Value: `" + token.width + "`.");
            }
            if (token.width < 0) {
              token.padRight = true;
              token.width = -token.width;
            }
          }
          if (hasPeriod) {
            if (token.precision === "*") {
              token.precision = parseInt(arguments[pos], 10);
              pos += 1;
              if (isnan(token.precision)) {
                throw new TypeError("the argument for * precision at position " + pos + " is not a number. Value: `" + token.precision + "`.");
              }
              if (token.precision < 0) {
                token.precision = 1;
                hasPeriod = false;
              }
            }
          }
          token.arg = arguments[pos];
          switch (token.specifier) {
            case "b":
            case "o":
            case "x":
            case "X":
            case "d":
            case "i":
            case "u":
              if (hasPeriod) {
                token.padZeros = false;
              }
              token.arg = formatInteger(token);
              break;
            case "s":
              token.maxWidth = hasPeriod ? token.precision : -1;
              token.arg = String(token.arg);
              break;
            case "c":
              if (!isnan(token.arg)) {
                num = parseInt(token.arg, 10);
                if (num < 0 || num > 127) {
                  throw new Error("invalid character code. Value: " + token.arg);
                }
                token.arg = isnan(num) ? String(token.arg) : fromCharCode(num);
              }
              break;
            case "e":
            case "E":
            case "f":
            case "F":
            case "g":
            case "G":
              if (!hasPeriod) {
                token.precision = 6;
              }
              f = parseFloat(token.arg);
              if (!isFinite(f)) {
                if (!isNumber(token.arg)) {
                  throw new Error("invalid floating-point number. Value: " + out);
                }
                f = token.arg;
                token.padZeros = false;
              }
              token.arg = formatDouble(f, token);
              break;
            default:
              throw new Error("invalid specifier: " + token.specifier);
          }
          if (token.maxWidth >= 0 && token.arg.length > token.maxWidth) {
            token.arg = token.arg.substring(0, token.maxWidth);
          }
          if (token.padZeros) {
            token.arg = zeroPad(token.arg, token.width || token.precision, token.padRight);
          } else if (token.width) {
            token.arg = spacePad(token.arg, token.width, token.padRight);
          }
          out += token.arg || "";
          pos += 1;
        }
      }
      return out;
    }
    module.exports = formatInterpolate;
  }
});

// node_modules/@stdlib/string-base-format-interpolate/lib/index.js
var require_lib15 = __commonJS({
  "node_modules/@stdlib/string-base-format-interpolate/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main7();
    module.exports = main;
  }
});

// node_modules/@stdlib/string-base-format-tokenize/lib/main.js
var require_main8 = __commonJS({
  "node_modules/@stdlib/string-base-format-tokenize/lib/main.js"(exports, module) {
    "use strict";
    var RE = /%(?:([1-9]\d*)\$)?([0 +\-#]*)(\*|\d+)?(?:(\.)(\*|\d+)?)?[hlL]?([%A-Za-z])/g;
    function parse(match) {
      var token = {
        "mapping": match[1] ? parseInt(match[1], 10) : void 0,
        "flags": match[2],
        "width": match[3],
        "precision": match[5],
        "specifier": match[6]
      };
      if (match[4] === "." && match[5] === void 0) {
        token.precision = "1";
      }
      return token;
    }
    function formatTokenize(str) {
      var content;
      var tokens;
      var match;
      var prev;
      tokens = [];
      prev = 0;
      match = RE.exec(str);
      while (match) {
        content = str.slice(prev, RE.lastIndex - match[0].length);
        if (content.length) {
          tokens.push(content);
        }
        if (match[6] === "%") {
          tokens.push("%");
        } else {
          tokens.push(parse(match));
        }
        prev = RE.lastIndex;
        match = RE.exec(str);
      }
      content = str.slice(prev);
      if (content.length) {
        tokens.push(content);
      }
      return tokens;
    }
    module.exports = formatTokenize;
  }
});

// node_modules/@stdlib/string-base-format-tokenize/lib/index.js
var require_lib16 = __commonJS({
  "node_modules/@stdlib/string-base-format-tokenize/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main8();
    module.exports = main;
  }
});

// node_modules/@stdlib/string-format/lib/is_string.js
var require_is_string2 = __commonJS({
  "node_modules/@stdlib/string-format/lib/is_string.js"(exports, module) {
    "use strict";
    function isString(value) {
      return typeof value === "string";
    }
    module.exports = isString;
  }
});

// node_modules/@stdlib/string-format/lib/main.js
var require_main9 = __commonJS({
  "node_modules/@stdlib/string-format/lib/main.js"(exports, module) {
    "use strict";
    var interpolate = require_lib15();
    var tokenize = require_lib16();
    var isString = require_is_string2();
    function format(str) {
      var args;
      var i;
      if (!isString(str)) {
        throw new TypeError(format("invalid argument. First argument must be a string. Value: `%s`.", str));
      }
      args = [tokenize(str)];
      for (i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      return interpolate.apply(null, args);
    }
    module.exports = format;
  }
});

// node_modules/@stdlib/string-format/lib/index.js
var require_lib17 = __commonJS({
  "node_modules/@stdlib/string-format/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main9();
    module.exports = main;
  }
});

// node_modules/@stdlib/utils-define-property/lib/polyfill.js
var require_polyfill = __commonJS({
  "node_modules/@stdlib/utils-define-property/lib/polyfill.js"(exports, module) {
    "use strict";
    var format = require_lib17();
    var objectProtoype = Object.prototype;
    var toStr = objectProtoype.toString;
    var defineGetter = objectProtoype.__defineGetter__;
    var defineSetter = objectProtoype.__defineSetter__;
    var lookupGetter = objectProtoype.__lookupGetter__;
    var lookupSetter = objectProtoype.__lookupSetter__;
    function defineProperty(obj, prop, descriptor) {
      var prototype;
      var hasValue;
      var hasGet;
      var hasSet;
      if (typeof obj !== "object" || obj === null || toStr.call(obj) === "[object Array]") {
        throw new TypeError(format("invalid argument. First argument must be an object. Value: `%s`.", obj));
      }
      if (typeof descriptor !== "object" || descriptor === null || toStr.call(descriptor) === "[object Array]") {
        throw new TypeError(format("invalid argument. Property descriptor must be an object. Value: `%s`.", descriptor));
      }
      hasValue = "value" in descriptor;
      if (hasValue) {
        if (lookupGetter.call(obj, prop) || lookupSetter.call(obj, prop)) {
          prototype = obj.__proto__;
          obj.__proto__ = objectProtoype;
          delete obj[prop];
          obj[prop] = descriptor.value;
          obj.__proto__ = prototype;
        } else {
          obj[prop] = descriptor.value;
        }
      }
      hasGet = "get" in descriptor;
      hasSet = "set" in descriptor;
      if (hasValue && (hasGet || hasSet)) {
        throw new Error("invalid argument. Cannot specify one or more accessors and a value or writable attribute in the property descriptor.");
      }
      if (hasGet && defineGetter) {
        defineGetter.call(obj, prop, descriptor.get);
      }
      if (hasSet && defineSetter) {
        defineSetter.call(obj, prop, descriptor.set);
      }
      return obj;
    }
    module.exports = defineProperty;
  }
});

// node_modules/@stdlib/utils-define-property/lib/index.js
var require_lib18 = __commonJS({
  "node_modules/@stdlib/utils-define-property/lib/index.js"(exports, module) {
    "use strict";
    var hasDefinePropertySupport = require_has_define_property_support();
    var builtin = require_builtin();
    var polyfill = require_polyfill();
    var defineProperty;
    if (hasDefinePropertySupport()) {
      defineProperty = builtin;
    } else {
      defineProperty = polyfill;
    }
    module.exports = defineProperty;
  }
});

// node_modules/@stdlib/utils-define-nonenumerable-read-only-property/lib/main.js
var require_main10 = __commonJS({
  "node_modules/@stdlib/utils-define-nonenumerable-read-only-property/lib/main.js"(exports, module) {
    "use strict";
    var defineProperty = require_lib18();
    function setNonEnumerableReadOnly(obj, prop, value) {
      defineProperty(obj, prop, {
        "configurable": false,
        "enumerable": false,
        "writable": false,
        "value": value
      });
    }
    module.exports = setNonEnumerableReadOnly;
  }
});

// node_modules/@stdlib/utils-define-nonenumerable-read-only-property/lib/index.js
var require_lib19 = __commonJS({
  "node_modules/@stdlib/utils-define-nonenumerable-read-only-property/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main10();
    module.exports = main;
  }
});

// node_modules/@stdlib/assert-has-symbol-support/lib/main.js
var require_main11 = __commonJS({
  "node_modules/@stdlib/assert-has-symbol-support/lib/main.js"(exports, module) {
    "use strict";
    function hasSymbolSupport() {
      return typeof Symbol === "function" && typeof /* @__PURE__ */ Symbol("foo") === "symbol";
    }
    module.exports = hasSymbolSupport;
  }
});

// node_modules/@stdlib/assert-has-symbol-support/lib/index.js
var require_lib20 = __commonJS({
  "node_modules/@stdlib/assert-has-symbol-support/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main11();
    module.exports = main;
  }
});

// node_modules/@stdlib/assert-has-tostringtag-support/lib/main.js
var require_main12 = __commonJS({
  "node_modules/@stdlib/assert-has-tostringtag-support/lib/main.js"(exports, module) {
    "use strict";
    var hasSymbols = require_lib20();
    var FLG = hasSymbols();
    function hasToStringTagSupport() {
      return FLG && typeof Symbol.toStringTag === "symbol";
    }
    module.exports = hasToStringTagSupport;
  }
});

// node_modules/@stdlib/assert-has-tostringtag-support/lib/index.js
var require_lib21 = __commonJS({
  "node_modules/@stdlib/assert-has-tostringtag-support/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main12();
    module.exports = main;
  }
});

// node_modules/@stdlib/utils-native-class/lib/tostring.js
var require_tostring = __commonJS({
  "node_modules/@stdlib/utils-native-class/lib/tostring.js"(exports, module) {
    "use strict";
    var toStr = Object.prototype.toString;
    module.exports = toStr;
  }
});

// node_modules/@stdlib/utils-native-class/lib/main.js
var require_main13 = __commonJS({
  "node_modules/@stdlib/utils-native-class/lib/main.js"(exports, module) {
    "use strict";
    var toStr = require_tostring();
    function nativeClass(v) {
      return toStr.call(v);
    }
    module.exports = nativeClass;
  }
});

// node_modules/@stdlib/assert-has-own-property/lib/main.js
var require_main14 = __commonJS({
  "node_modules/@stdlib/assert-has-own-property/lib/main.js"(exports, module) {
    "use strict";
    var has = Object.prototype.hasOwnProperty;
    function hasOwnProp(value, property) {
      if (value === void 0 || value === null) {
        return false;
      }
      return has.call(value, property);
    }
    module.exports = hasOwnProp;
  }
});

// node_modules/@stdlib/assert-has-own-property/lib/index.js
var require_lib22 = __commonJS({
  "node_modules/@stdlib/assert-has-own-property/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main14();
    module.exports = main;
  }
});

// node_modules/@stdlib/symbol-ctor/lib/main.js
var require_main15 = __commonJS({
  "node_modules/@stdlib/symbol-ctor/lib/main.js"(exports, module) {
    "use strict";
    var Sym = typeof Symbol === "function" ? Symbol : void 0;
    module.exports = Sym;
  }
});

// node_modules/@stdlib/symbol-ctor/lib/index.js
var require_lib23 = __commonJS({
  "node_modules/@stdlib/symbol-ctor/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main15();
    module.exports = main;
  }
});

// node_modules/@stdlib/utils-native-class/lib/tostringtag.js
var require_tostringtag = __commonJS({
  "node_modules/@stdlib/utils-native-class/lib/tostringtag.js"(exports, module) {
    "use strict";
    var Symbol2 = require_lib23();
    var toStrTag = typeof Symbol2 === "function" ? Symbol2.toStringTag : "";
    module.exports = toStrTag;
  }
});

// node_modules/@stdlib/utils-native-class/lib/polyfill.js
var require_polyfill2 = __commonJS({
  "node_modules/@stdlib/utils-native-class/lib/polyfill.js"(exports, module) {
    "use strict";
    var hasOwnProp = require_lib22();
    var toStringTag = require_tostringtag();
    var toStr = require_tostring();
    function nativeClass(v) {
      var isOwn;
      var tag;
      var out;
      if (v === null || v === void 0) {
        return toStr.call(v);
      }
      tag = v[toStringTag];
      isOwn = hasOwnProp(v, toStringTag);
      try {
        v[toStringTag] = void 0;
      } catch (err) {
        return toStr.call(v);
      }
      out = toStr.call(v);
      if (isOwn) {
        v[toStringTag] = tag;
      } else {
        delete v[toStringTag];
      }
      return out;
    }
    module.exports = nativeClass;
  }
});

// node_modules/@stdlib/utils-native-class/lib/index.js
var require_lib24 = __commonJS({
  "node_modules/@stdlib/utils-native-class/lib/index.js"(exports, module) {
    "use strict";
    var hasToStringTag = require_lib21();
    var builtin = require_main13();
    var polyfill = require_polyfill2();
    var main;
    if (hasToStringTag()) {
      main = polyfill;
    } else {
      main = builtin;
    }
    module.exports = main;
  }
});

// node_modules/@stdlib/assert-is-uint32array/lib/main.js
var require_main16 = __commonJS({
  "node_modules/@stdlib/assert-is-uint32array/lib/main.js"(exports, module) {
    "use strict";
    var nativeClass = require_lib24();
    var hasUint32Array = typeof Uint32Array === "function";
    function isUint32Array(value) {
      return hasUint32Array && value instanceof Uint32Array || // eslint-disable-line stdlib/require-globals
      nativeClass(value) === "[object Uint32Array]";
    }
    module.exports = isUint32Array;
  }
});

// node_modules/@stdlib/assert-is-uint32array/lib/index.js
var require_lib25 = __commonJS({
  "node_modules/@stdlib/assert-is-uint32array/lib/index.js"(exports, module) {
    "use strict";
    var isUint32Array = require_main16();
    module.exports = isUint32Array;
  }
});

// node_modules/@stdlib/constants-uint32-max/lib/index.js
var require_lib26 = __commonJS({
  "node_modules/@stdlib/constants-uint32-max/lib/index.js"(exports, module) {
    "use strict";
    var UINT32_MAX = 4294967295;
    module.exports = UINT32_MAX;
  }
});

// node_modules/@stdlib/assert-has-uint32array-support/lib/uint32array.js
var require_uint32array = __commonJS({
  "node_modules/@stdlib/assert-has-uint32array-support/lib/uint32array.js"(exports, module) {
    "use strict";
    var main = typeof Uint32Array === "function" ? Uint32Array : null;
    module.exports = main;
  }
});

// node_modules/@stdlib/assert-has-uint32array-support/lib/main.js
var require_main17 = __commonJS({
  "node_modules/@stdlib/assert-has-uint32array-support/lib/main.js"(exports, module) {
    "use strict";
    var isUint32Array = require_lib25();
    var UINT32_MAX = require_lib26();
    var GlobalUint32Array = require_uint32array();
    function hasUint32ArraySupport() {
      var bool;
      var arr;
      if (typeof GlobalUint32Array !== "function") {
        return false;
      }
      try {
        arr = [1, 3.14, -3.14, UINT32_MAX + 1, UINT32_MAX + 2];
        arr = new GlobalUint32Array(arr);
        bool = isUint32Array(arr) && arr[0] === 1 && arr[1] === 3 && // truncation
        arr[2] === UINT32_MAX - 2 && // truncation and wrap around
        arr[3] === 0 && // wrap around
        arr[4] === 1;
      } catch (err) {
        bool = false;
      }
      return bool;
    }
    module.exports = hasUint32ArraySupport;
  }
});

// node_modules/@stdlib/assert-has-uint32array-support/lib/index.js
var require_lib27 = __commonJS({
  "node_modules/@stdlib/assert-has-uint32array-support/lib/index.js"(exports, module) {
    "use strict";
    var hasUint32ArraySupport = require_main17();
    module.exports = hasUint32ArraySupport;
  }
});

// node_modules/@stdlib/array-uint32/lib/main.js
var require_main18 = __commonJS({
  "node_modules/@stdlib/array-uint32/lib/main.js"(exports, module) {
    "use strict";
    var ctor = typeof Uint32Array === "function" ? Uint32Array : void 0;
    module.exports = ctor;
  }
});

// node_modules/@stdlib/array-uint32/lib/polyfill.js
var require_polyfill3 = __commonJS({
  "node_modules/@stdlib/array-uint32/lib/polyfill.js"(exports, module) {
    "use strict";
    function polyfill() {
      throw new Error("not implemented");
    }
    module.exports = polyfill;
  }
});

// node_modules/@stdlib/array-uint32/lib/index.js
var require_lib28 = __commonJS({
  "node_modules/@stdlib/array-uint32/lib/index.js"(exports, module) {
    "use strict";
    var hasUint32ArraySupport = require_lib27();
    var builtin = require_main18();
    var polyfill = require_polyfill3();
    var ctor;
    if (hasUint32ArraySupport()) {
      ctor = builtin;
    } else {
      ctor = polyfill;
    }
    module.exports = ctor;
  }
});

// node_modules/@stdlib/assert-is-float64array/lib/main.js
var require_main19 = __commonJS({
  "node_modules/@stdlib/assert-is-float64array/lib/main.js"(exports, module) {
    "use strict";
    var nativeClass = require_lib24();
    var hasFloat64Array = typeof Float64Array === "function";
    function isFloat64Array(value) {
      return hasFloat64Array && value instanceof Float64Array || // eslint-disable-line stdlib/require-globals
      nativeClass(value) === "[object Float64Array]";
    }
    module.exports = isFloat64Array;
  }
});

// node_modules/@stdlib/assert-is-float64array/lib/index.js
var require_lib29 = __commonJS({
  "node_modules/@stdlib/assert-is-float64array/lib/index.js"(exports, module) {
    "use strict";
    var isFloat64Array = require_main19();
    module.exports = isFloat64Array;
  }
});

// node_modules/@stdlib/assert-has-float64array-support/lib/float64array.js
var require_float64array = __commonJS({
  "node_modules/@stdlib/assert-has-float64array-support/lib/float64array.js"(exports, module) {
    "use strict";
    var main = typeof Float64Array === "function" ? Float64Array : null;
    module.exports = main;
  }
});

// node_modules/@stdlib/assert-has-float64array-support/lib/main.js
var require_main20 = __commonJS({
  "node_modules/@stdlib/assert-has-float64array-support/lib/main.js"(exports, module) {
    "use strict";
    var isFloat64Array = require_lib29();
    var GlobalFloat64Array = require_float64array();
    function hasFloat64ArraySupport() {
      var bool;
      var arr;
      if (typeof GlobalFloat64Array !== "function") {
        return false;
      }
      try {
        arr = new GlobalFloat64Array([1, 3.14, -3.14, NaN]);
        bool = isFloat64Array(arr) && arr[0] === 1 && arr[1] === 3.14 && arr[2] === -3.14 && arr[3] !== arr[3];
      } catch (err) {
        bool = false;
      }
      return bool;
    }
    module.exports = hasFloat64ArraySupport;
  }
});

// node_modules/@stdlib/assert-has-float64array-support/lib/index.js
var require_lib30 = __commonJS({
  "node_modules/@stdlib/assert-has-float64array-support/lib/index.js"(exports, module) {
    "use strict";
    var hasFloat64ArraySupport = require_main20();
    module.exports = hasFloat64ArraySupport;
  }
});

// node_modules/@stdlib/array-float64/lib/main.js
var require_main21 = __commonJS({
  "node_modules/@stdlib/array-float64/lib/main.js"(exports, module) {
    "use strict";
    var ctor = typeof Float64Array === "function" ? Float64Array : void 0;
    module.exports = ctor;
  }
});

// node_modules/@stdlib/array-float64/lib/polyfill.js
var require_polyfill4 = __commonJS({
  "node_modules/@stdlib/array-float64/lib/polyfill.js"(exports, module) {
    "use strict";
    function polyfill() {
      throw new Error("not implemented");
    }
    module.exports = polyfill;
  }
});

// node_modules/@stdlib/array-float64/lib/index.js
var require_lib31 = __commonJS({
  "node_modules/@stdlib/array-float64/lib/index.js"(exports, module) {
    "use strict";
    var hasFloat64ArraySupport = require_lib30();
    var builtin = require_main21();
    var polyfill = require_polyfill4();
    var ctor;
    if (hasFloat64ArraySupport()) {
      ctor = builtin;
    } else {
      ctor = polyfill;
    }
    module.exports = ctor;
  }
});

// node_modules/@stdlib/assert-is-uint8array/lib/main.js
var require_main22 = __commonJS({
  "node_modules/@stdlib/assert-is-uint8array/lib/main.js"(exports, module) {
    "use strict";
    var nativeClass = require_lib24();
    var hasUint8Array = typeof Uint8Array === "function";
    function isUint8Array(value) {
      return hasUint8Array && value instanceof Uint8Array || // eslint-disable-line stdlib/require-globals
      nativeClass(value) === "[object Uint8Array]";
    }
    module.exports = isUint8Array;
  }
});

// node_modules/@stdlib/assert-is-uint8array/lib/index.js
var require_lib32 = __commonJS({
  "node_modules/@stdlib/assert-is-uint8array/lib/index.js"(exports, module) {
    "use strict";
    var isUint8Array = require_main22();
    module.exports = isUint8Array;
  }
});

// node_modules/@stdlib/constants-uint8-max/lib/index.js
var require_lib33 = __commonJS({
  "node_modules/@stdlib/constants-uint8-max/lib/index.js"(exports, module) {
    "use strict";
    var UINT8_MAX = 255 | 0;
    module.exports = UINT8_MAX;
  }
});

// node_modules/@stdlib/assert-has-uint8array-support/lib/uint8array.js
var require_uint8array = __commonJS({
  "node_modules/@stdlib/assert-has-uint8array-support/lib/uint8array.js"(exports, module) {
    "use strict";
    var main = typeof Uint8Array === "function" ? Uint8Array : null;
    module.exports = main;
  }
});

// node_modules/@stdlib/assert-has-uint8array-support/lib/main.js
var require_main23 = __commonJS({
  "node_modules/@stdlib/assert-has-uint8array-support/lib/main.js"(exports, module) {
    "use strict";
    var isUint8Array = require_lib32();
    var UINT8_MAX = require_lib33();
    var GlobalUint8Array = require_uint8array();
    function hasUint8ArraySupport() {
      var bool;
      var arr;
      if (typeof GlobalUint8Array !== "function") {
        return false;
      }
      try {
        arr = [1, 3.14, -3.14, UINT8_MAX + 1, UINT8_MAX + 2];
        arr = new GlobalUint8Array(arr);
        bool = isUint8Array(arr) && arr[0] === 1 && arr[1] === 3 && // truncation
        arr[2] === UINT8_MAX - 2 && // truncation and wrap around
        arr[3] === 0 && // wrap around
        arr[4] === 1;
      } catch (err) {
        bool = false;
      }
      return bool;
    }
    module.exports = hasUint8ArraySupport;
  }
});

// node_modules/@stdlib/assert-has-uint8array-support/lib/index.js
var require_lib34 = __commonJS({
  "node_modules/@stdlib/assert-has-uint8array-support/lib/index.js"(exports, module) {
    "use strict";
    var hasUint8ArraySupport = require_main23();
    module.exports = hasUint8ArraySupport;
  }
});

// node_modules/@stdlib/array-uint8/lib/main.js
var require_main24 = __commonJS({
  "node_modules/@stdlib/array-uint8/lib/main.js"(exports, module) {
    "use strict";
    var ctor = typeof Uint8Array === "function" ? Uint8Array : void 0;
    module.exports = ctor;
  }
});

// node_modules/@stdlib/array-uint8/lib/polyfill.js
var require_polyfill5 = __commonJS({
  "node_modules/@stdlib/array-uint8/lib/polyfill.js"(exports, module) {
    "use strict";
    function polyfill() {
      throw new Error("not implemented");
    }
    module.exports = polyfill;
  }
});

// node_modules/@stdlib/array-uint8/lib/index.js
var require_lib35 = __commonJS({
  "node_modules/@stdlib/array-uint8/lib/index.js"(exports, module) {
    "use strict";
    var hasUint8ArraySupport = require_lib34();
    var builtin = require_main24();
    var polyfill = require_polyfill5();
    var ctor;
    if (hasUint8ArraySupport()) {
      ctor = builtin;
    } else {
      ctor = polyfill;
    }
    module.exports = ctor;
  }
});

// node_modules/@stdlib/assert-is-uint16array/lib/main.js
var require_main25 = __commonJS({
  "node_modules/@stdlib/assert-is-uint16array/lib/main.js"(exports, module) {
    "use strict";
    var nativeClass = require_lib24();
    var hasUint16Array = typeof Uint16Array === "function";
    function isUint16Array(value) {
      return hasUint16Array && value instanceof Uint16Array || // eslint-disable-line stdlib/require-globals
      nativeClass(value) === "[object Uint16Array]";
    }
    module.exports = isUint16Array;
  }
});

// node_modules/@stdlib/assert-is-uint16array/lib/index.js
var require_lib36 = __commonJS({
  "node_modules/@stdlib/assert-is-uint16array/lib/index.js"(exports, module) {
    "use strict";
    var isUint16Array = require_main25();
    module.exports = isUint16Array;
  }
});

// node_modules/@stdlib/constants-uint16-max/lib/index.js
var require_lib37 = __commonJS({
  "node_modules/@stdlib/constants-uint16-max/lib/index.js"(exports, module) {
    "use strict";
    var UINT16_MAX = 65535 | 0;
    module.exports = UINT16_MAX;
  }
});

// node_modules/@stdlib/assert-has-uint16array-support/lib/uint16array.js
var require_uint16array = __commonJS({
  "node_modules/@stdlib/assert-has-uint16array-support/lib/uint16array.js"(exports, module) {
    "use strict";
    var main = typeof Uint16Array === "function" ? Uint16Array : null;
    module.exports = main;
  }
});

// node_modules/@stdlib/assert-has-uint16array-support/lib/main.js
var require_main26 = __commonJS({
  "node_modules/@stdlib/assert-has-uint16array-support/lib/main.js"(exports, module) {
    "use strict";
    var isUint16Array = require_lib36();
    var UINT16_MAX = require_lib37();
    var GlobalUint16Array = require_uint16array();
    function hasUint16ArraySupport() {
      var bool;
      var arr;
      if (typeof GlobalUint16Array !== "function") {
        return false;
      }
      try {
        arr = [1, 3.14, -3.14, UINT16_MAX + 1, UINT16_MAX + 2];
        arr = new GlobalUint16Array(arr);
        bool = isUint16Array(arr) && arr[0] === 1 && arr[1] === 3 && // truncation
        arr[2] === UINT16_MAX - 2 && // truncation and wrap around
        arr[3] === 0 && // wrap around
        arr[4] === 1;
      } catch (err) {
        bool = false;
      }
      return bool;
    }
    module.exports = hasUint16ArraySupport;
  }
});

// node_modules/@stdlib/assert-has-uint16array-support/lib/index.js
var require_lib38 = __commonJS({
  "node_modules/@stdlib/assert-has-uint16array-support/lib/index.js"(exports, module) {
    "use strict";
    var hasUint16ArraySupport = require_main26();
    module.exports = hasUint16ArraySupport;
  }
});

// node_modules/@stdlib/array-uint16/lib/main.js
var require_main27 = __commonJS({
  "node_modules/@stdlib/array-uint16/lib/main.js"(exports, module) {
    "use strict";
    var ctor = typeof Uint16Array === "function" ? Uint16Array : void 0;
    module.exports = ctor;
  }
});

// node_modules/@stdlib/array-uint16/lib/polyfill.js
var require_polyfill6 = __commonJS({
  "node_modules/@stdlib/array-uint16/lib/polyfill.js"(exports, module) {
    "use strict";
    function polyfill() {
      throw new Error("not implemented");
    }
    module.exports = polyfill;
  }
});

// node_modules/@stdlib/array-uint16/lib/index.js
var require_lib39 = __commonJS({
  "node_modules/@stdlib/array-uint16/lib/index.js"(exports, module) {
    "use strict";
    var hasUint16ArraySupport = require_lib38();
    var builtin = require_main27();
    var polyfill = require_polyfill6();
    var ctor;
    if (hasUint16ArraySupport()) {
      ctor = builtin;
    } else {
      ctor = polyfill;
    }
    module.exports = ctor;
  }
});

// node_modules/@stdlib/assert-is-little-endian/lib/ctors.js
var require_ctors = __commonJS({
  "node_modules/@stdlib/assert-is-little-endian/lib/ctors.js"(exports, module) {
    "use strict";
    var Uint8Array2 = require_lib35();
    var Uint16Array2 = require_lib39();
    var ctors = {
      "uint16": Uint16Array2,
      "uint8": Uint8Array2
    };
    module.exports = ctors;
  }
});

// node_modules/@stdlib/assert-is-little-endian/lib/main.js
var require_main28 = __commonJS({
  "node_modules/@stdlib/assert-is-little-endian/lib/main.js"(exports, module) {
    "use strict";
    var ctors = require_ctors();
    var bool;
    function isLittleEndian() {
      var uint16view;
      var uint8view;
      uint16view = new ctors["uint16"](1);
      uint16view[0] = 4660;
      uint8view = new ctors["uint8"](uint16view.buffer);
      return uint8view[0] === 52;
    }
    bool = isLittleEndian();
    module.exports = bool;
  }
});

// node_modules/@stdlib/assert-is-little-endian/lib/index.js
var require_lib40 = __commonJS({
  "node_modules/@stdlib/assert-is-little-endian/lib/index.js"(exports, module) {
    "use strict";
    var IS_LITTLE_ENDIAN = require_main28();
    module.exports = IS_LITTLE_ENDIAN;
  }
});

// node_modules/@stdlib/number-float64-base-to-words/lib/indices.js
var require_indices = __commonJS({
  "node_modules/@stdlib/number-float64-base-to-words/lib/indices.js"(exports, module) {
    "use strict";
    var isLittleEndian = require_lib40();
    var indices;
    var HIGH;
    var LOW;
    if (isLittleEndian === true) {
      HIGH = 1;
      LOW = 0;
    } else {
      HIGH = 0;
      LOW = 1;
    }
    indices = {
      "HIGH": HIGH,
      "LOW": LOW
    };
    module.exports = indices;
  }
});

// node_modules/@stdlib/number-float64-base-to-words/lib/assign.js
var require_assign = __commonJS({
  "node_modules/@stdlib/number-float64-base-to-words/lib/assign.js"(exports, module) {
    "use strict";
    var Uint32Array2 = require_lib28();
    var Float64Array2 = require_lib31();
    var indices = require_indices();
    var FLOAT64_VIEW = new Float64Array2(1);
    var UINT32_VIEW = new Uint32Array2(FLOAT64_VIEW.buffer);
    var HIGH = indices.HIGH;
    var LOW = indices.LOW;
    function toWords(x, out, stride, offset) {
      FLOAT64_VIEW[0] = x;
      out[offset] = UINT32_VIEW[HIGH];
      out[offset + stride] = UINT32_VIEW[LOW];
      return out;
    }
    module.exports = toWords;
  }
});

// node_modules/@stdlib/number-float64-base-to-words/lib/main.js
var require_main29 = __commonJS({
  "node_modules/@stdlib/number-float64-base-to-words/lib/main.js"(exports, module) {
    "use strict";
    var fcn = require_assign();
    function toWords(x) {
      return fcn(x, [0 >>> 0, 0 >>> 0], 1, 0);
    }
    module.exports = toWords;
  }
});

// node_modules/@stdlib/number-float64-base-to-words/lib/index.js
var require_lib41 = __commonJS({
  "node_modules/@stdlib/number-float64-base-to-words/lib/index.js"(exports, module) {
    "use strict";
    var setReadOnly = require_lib19();
    var main = require_main29();
    var assign = require_assign();
    setReadOnly(main, "assign", assign);
    module.exports = main;
  }
});

// node_modules/@stdlib/number-float64-base-get-high-word/lib/high.js
var require_high = __commonJS({
  "node_modules/@stdlib/number-float64-base-get-high-word/lib/high.js"(exports, module) {
    "use strict";
    var isLittleEndian = require_lib40();
    var HIGH;
    if (isLittleEndian === true) {
      HIGH = 1;
    } else {
      HIGH = 0;
    }
    module.exports = HIGH;
  }
});

// node_modules/@stdlib/number-float64-base-get-high-word/lib/main.js
var require_main30 = __commonJS({
  "node_modules/@stdlib/number-float64-base-get-high-word/lib/main.js"(exports, module) {
    "use strict";
    var Uint32Array2 = require_lib28();
    var Float64Array2 = require_lib31();
    var HIGH = require_high();
    var FLOAT64_VIEW = new Float64Array2(1);
    var UINT32_VIEW = new Uint32Array2(FLOAT64_VIEW.buffer);
    function getHighWord(x) {
      FLOAT64_VIEW[0] = x;
      return UINT32_VIEW[HIGH];
    }
    module.exports = getHighWord;
  }
});

// node_modules/@stdlib/number-float64-base-get-high-word/lib/index.js
var require_lib42 = __commonJS({
  "node_modules/@stdlib/number-float64-base-get-high-word/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main30();
    module.exports = main;
  }
});

// node_modules/@stdlib/number-float64-base-from-words/lib/indices.js
var require_indices2 = __commonJS({
  "node_modules/@stdlib/number-float64-base-from-words/lib/indices.js"(exports, module) {
    "use strict";
    var isLittleEndian = require_lib40();
    var indices;
    var HIGH;
    var LOW;
    if (isLittleEndian === true) {
      HIGH = 1;
      LOW = 0;
    } else {
      HIGH = 0;
      LOW = 1;
    }
    indices = {
      "HIGH": HIGH,
      "LOW": LOW
    };
    module.exports = indices;
  }
});

// node_modules/@stdlib/number-float64-base-from-words/lib/main.js
var require_main31 = __commonJS({
  "node_modules/@stdlib/number-float64-base-from-words/lib/main.js"(exports, module) {
    "use strict";
    var Uint32Array2 = require_lib28();
    var Float64Array2 = require_lib31();
    var indices = require_indices2();
    var FLOAT64_VIEW = new Float64Array2(1);
    var UINT32_VIEW = new Uint32Array2(FLOAT64_VIEW.buffer);
    var HIGH = indices.HIGH;
    var LOW = indices.LOW;
    function fromWords(high, low) {
      UINT32_VIEW[HIGH] = high;
      UINT32_VIEW[LOW] = low;
      return FLOAT64_VIEW[0];
    }
    module.exports = fromWords;
  }
});

// node_modules/@stdlib/number-float64-base-from-words/lib/index.js
var require_lib43 = __commonJS({
  "node_modules/@stdlib/number-float64-base-from-words/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main31();
    module.exports = main;
  }
});

// node_modules/@stdlib/math-base-special-copysign/lib/main.js
var require_main32 = __commonJS({
  "node_modules/@stdlib/math-base-special-copysign/lib/main.js"(exports, module) {
    "use strict";
    var SIGN_MASK = require_lib13();
    var ABS_MASK = require_lib14();
    var toWords = require_lib41();
    var getHighWord = require_lib42();
    var fromWords = require_lib43();
    var WORDS = [0, 0];
    function copysign(x, y) {
      var hx;
      var hy;
      toWords.assign(x, WORDS, 1, 0);
      hx = WORDS[0];
      hx &= ABS_MASK;
      hy = getHighWord(y);
      hy &= SIGN_MASK;
      hx |= hy;
      return fromWords(hx, WORDS[1]);
    }
    module.exports = copysign;
  }
});

// node_modules/@stdlib/math-base-special-copysign/lib/index.js
var require_lib44 = __commonJS({
  "node_modules/@stdlib/math-base-special-copysign/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main32();
    module.exports = main;
  }
});

// node_modules/@stdlib/constants-float64-smallest-normal/lib/index.js
var require_lib45 = __commonJS({
  "node_modules/@stdlib/constants-float64-smallest-normal/lib/index.js"(exports, module) {
    "use strict";
    var FLOAT64_SMALLEST_NORMAL = 22250738585072014e-324;
    module.exports = FLOAT64_SMALLEST_NORMAL;
  }
});

// node_modules/@stdlib/math-base-special-abs/lib/main.js
var require_main33 = __commonJS({
  "node_modules/@stdlib/math-base-special-abs/lib/main.js"(exports, module) {
    "use strict";
    function abs(x) {
      return Math.abs(x);
    }
    module.exports = abs;
  }
});

// node_modules/@stdlib/math-base-special-abs/lib/index.js
var require_lib46 = __commonJS({
  "node_modules/@stdlib/math-base-special-abs/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main33();
    module.exports = main;
  }
});

// node_modules/@stdlib/number-float64-base-normalize/lib/assign.js
var require_assign2 = __commonJS({
  "node_modules/@stdlib/number-float64-base-normalize/lib/assign.js"(exports, module) {
    "use strict";
    var FLOAT64_SMALLEST_NORMAL = require_lib45();
    var isInfinite = require_lib12();
    var isnan = require_lib();
    var abs = require_lib46();
    var SCALAR = 4503599627370496;
    function normalize(x, out, stride, offset) {
      if (isnan(x) || isInfinite(x)) {
        out[offset] = x;
        out[offset + stride] = 0;
        return out;
      }
      if (x !== 0 && abs(x) < FLOAT64_SMALLEST_NORMAL) {
        out[offset] = x * SCALAR;
        out[offset + stride] = -52;
        return out;
      }
      out[offset] = x;
      out[offset + stride] = 0;
      return out;
    }
    module.exports = normalize;
  }
});

// node_modules/@stdlib/number-float64-base-normalize/lib/main.js
var require_main34 = __commonJS({
  "node_modules/@stdlib/number-float64-base-normalize/lib/main.js"(exports, module) {
    "use strict";
    var fcn = require_assign2();
    function normalize(x) {
      return fcn(x, [0, 0], 1, 0);
    }
    module.exports = normalize;
  }
});

// node_modules/@stdlib/number-float64-base-normalize/lib/index.js
var require_lib47 = __commonJS({
  "node_modules/@stdlib/number-float64-base-normalize/lib/index.js"(exports, module) {
    "use strict";
    var setReadOnly = require_lib19();
    var main = require_main34();
    var assign = require_assign2();
    setReadOnly(main, "assign", assign);
    module.exports = main;
  }
});

// node_modules/@stdlib/constants-float64-high-word-exponent-mask/lib/index.js
var require_lib48 = __commonJS({
  "node_modules/@stdlib/constants-float64-high-word-exponent-mask/lib/index.js"(exports, module) {
    "use strict";
    var FLOAT64_HIGH_WORD_EXPONENT_MASK = 2146435072;
    module.exports = FLOAT64_HIGH_WORD_EXPONENT_MASK;
  }
});

// node_modules/@stdlib/number-float64-base-exponent/lib/main.js
var require_main35 = __commonJS({
  "node_modules/@stdlib/number-float64-base-exponent/lib/main.js"(exports, module) {
    "use strict";
    var getHighWord = require_lib42();
    var EXP_MASK = require_lib48();
    var BIAS = require_lib8();
    function exponent(x) {
      var high = getHighWord(x);
      high = (high & EXP_MASK) >>> 20;
      return high - BIAS | 0;
    }
    module.exports = exponent;
  }
});

// node_modules/@stdlib/number-float64-base-exponent/lib/index.js
var require_lib49 = __commonJS({
  "node_modules/@stdlib/number-float64-base-exponent/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main35();
    module.exports = main;
  }
});

// node_modules/@stdlib/math-base-special-ldexp/lib/main.js
var require_main36 = __commonJS({
  "node_modules/@stdlib/math-base-special-ldexp/lib/main.js"(exports, module) {
    "use strict";
    var PINF = require_lib7();
    var NINF = require_lib6();
    var BIAS = require_lib8();
    var MAX_EXPONENT = require_lib9();
    var MAX_SUBNORMAL_EXPONENT = require_lib10();
    var MIN_SUBNORMAL_EXPONENT = require_lib11();
    var isnan = require_lib();
    var isInfinite = require_lib12();
    var copysign = require_lib44();
    var normalize = require_lib47().assign;
    var floatExp = require_lib49();
    var toWords = require_lib41();
    var fromWords = require_lib43();
    var TWO52_INV = 2220446049250313e-31;
    var CLEAR_EXP_MASK = 2148532223 >>> 0;
    var FRAC = [0, 0];
    var WORDS = [0, 0];
    function ldexp(frac, exp) {
      var high;
      var m;
      if (exp === 0 || frac === 0 || // handles +-0
      isnan(frac) || isInfinite(frac)) {
        return frac;
      }
      normalize(frac, FRAC, 1, 0);
      frac = FRAC[0];
      exp += FRAC[1];
      exp += floatExp(frac);
      if (exp < MIN_SUBNORMAL_EXPONENT) {
        return copysign(0, frac);
      }
      if (exp > MAX_EXPONENT) {
        if (frac < 0) {
          return NINF;
        }
        return PINF;
      }
      if (exp <= MAX_SUBNORMAL_EXPONENT) {
        exp += 52;
        m = TWO52_INV;
      } else {
        m = 1;
      }
      toWords.assign(frac, WORDS, 1, 0);
      high = WORDS[0];
      high &= CLEAR_EXP_MASK;
      high |= exp + BIAS << 20;
      return m * fromWords(high, WORDS[1]);
    }
    module.exports = ldexp;
  }
});

// node_modules/@stdlib/math-base-special-ldexp/lib/index.js
var require_lib50 = __commonJS({
  "node_modules/@stdlib/math-base-special-ldexp/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main36();
    module.exports = main;
  }
});

// node_modules/@stdlib/math-base-special-exp/lib/polyval_p.js
var require_polyval_p = __commonJS({
  "node_modules/@stdlib/math-base-special-exp/lib/polyval_p.js"(exports, module) {
    "use strict";
    function evalpoly(x) {
      if (x === 0) {
        return 0.16666666666666602;
      }
      return 0.16666666666666602 + x * (-0.0027777777777015593 + x * (6613756321437934e-20 + x * (-16533902205465252e-22 + x * 41381367970572385e-24)));
    }
    module.exports = evalpoly;
  }
});

// node_modules/@stdlib/math-base-special-exp/lib/expmulti.js
var require_expmulti = __commonJS({
  "node_modules/@stdlib/math-base-special-exp/lib/expmulti.js"(exports, module) {
    "use strict";
    var ldexp = require_lib50();
    var polyvalP = require_polyval_p();
    function expmulti(hi, lo, k) {
      var r;
      var t;
      var c;
      var y;
      r = hi - lo;
      t = r * r;
      c = r - t * polyvalP(t);
      y = 1 - (lo - r * c / (2 - c) - hi);
      return ldexp(y, k);
    }
    module.exports = expmulti;
  }
});

// node_modules/@stdlib/math-base-special-exp/lib/main.js
var require_main37 = __commonJS({
  "node_modules/@stdlib/math-base-special-exp/lib/main.js"(exports, module) {
    "use strict";
    var isnan = require_lib();
    var trunc = require_lib4();
    var NINF = require_lib6();
    var PINF = require_lib7();
    var expmulti = require_expmulti();
    var LN2_HI = 0.6931471803691238;
    var LN2_LO = 19082149292705877e-26;
    var LOG2_E = 1.4426950408889634;
    var OVERFLOW = 709.782712893384;
    var UNDERFLOW = -745.1332191019411;
    var NEARZERO = 1 / (1 << 28);
    var NEG_NEARZERO = -NEARZERO;
    function exp(x) {
      var hi;
      var lo;
      var k;
      if (isnan(x) || x === PINF) {
        return x;
      }
      if (x === NINF) {
        return 0;
      }
      if (x > OVERFLOW) {
        return PINF;
      }
      if (x < UNDERFLOW) {
        return 0;
      }
      if (x > NEG_NEARZERO && x < NEARZERO) {
        return 1 + x;
      }
      if (x < 0) {
        k = trunc(LOG2_E * x - 0.5);
      } else {
        k = trunc(LOG2_E * x + 0.5);
      }
      hi = x - k * LN2_HI;
      lo = k * LN2_LO;
      return expmulti(hi, lo, k);
    }
    module.exports = exp;
  }
});

// node_modules/@stdlib/math-base-special-exp/lib/index.js
var require_lib51 = __commonJS({
  "node_modules/@stdlib/math-base-special-exp/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main37();
    module.exports = main;
  }
});

// node_modules/@stdlib/number-float64-base-set-low-word/lib/low.js
var require_low = __commonJS({
  "node_modules/@stdlib/number-float64-base-set-low-word/lib/low.js"(exports, module) {
    "use strict";
    var isLittleEndian = require_lib40();
    var LOW;
    if (isLittleEndian === true) {
      LOW = 0;
    } else {
      LOW = 1;
    }
    module.exports = LOW;
  }
});

// node_modules/@stdlib/number-float64-base-set-low-word/lib/main.js
var require_main38 = __commonJS({
  "node_modules/@stdlib/number-float64-base-set-low-word/lib/main.js"(exports, module) {
    "use strict";
    var Uint32Array2 = require_lib28();
    var Float64Array2 = require_lib31();
    var LOW = require_low();
    var FLOAT64_VIEW = new Float64Array2(1);
    var UINT32_VIEW = new Uint32Array2(FLOAT64_VIEW.buffer);
    function setLowWord(x, low) {
      FLOAT64_VIEW[0] = x;
      UINT32_VIEW[LOW] = low >>> 0;
      return FLOAT64_VIEW[0];
    }
    module.exports = setLowWord;
  }
});

// node_modules/@stdlib/number-float64-base-set-low-word/lib/index.js
var require_lib52 = __commonJS({
  "node_modules/@stdlib/number-float64-base-set-low-word/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main38();
    module.exports = main;
  }
});

// node_modules/@stdlib/math-base-special-erf/lib/polyval_pp.js
var require_polyval_pp = __commonJS({
  "node_modules/@stdlib/math-base-special-erf/lib/polyval_pp.js"(exports, module) {
    "use strict";
    function evalpoly(x) {
      if (x === 0) {
        return -0.3250421072470015;
      }
      return -0.3250421072470015 + x * (-0.02848174957559851 + x * (-0.005770270296489442 + x * -23763016656650163e-21));
    }
    module.exports = evalpoly;
  }
});

// node_modules/@stdlib/math-base-special-erf/lib/polyval_qq.js
var require_polyval_qq = __commonJS({
  "node_modules/@stdlib/math-base-special-erf/lib/polyval_qq.js"(exports, module) {
    "use strict";
    function evalpoly(x) {
      if (x === 0) {
        return 0.39791722395915535;
      }
      return 0.39791722395915535 + x * (0.0650222499887673 + x * (0.005081306281875766 + x * (13249473800432164e-20 + x * -3960228278775368e-21)));
    }
    module.exports = evalpoly;
  }
});

// node_modules/@stdlib/math-base-special-erf/lib/polyval_pa.js
var require_polyval_pa = __commonJS({
  "node_modules/@stdlib/math-base-special-erf/lib/polyval_pa.js"(exports, module) {
    "use strict";
    function evalpoly(x) {
      if (x === 0) {
        return 0.41485611868374833;
      }
      return 0.41485611868374833 + x * (-0.3722078760357013 + x * (0.31834661990116175 + x * (-0.11089469428239668 + x * (0.035478304325618236 + x * -0.002166375594868791))));
    }
    module.exports = evalpoly;
  }
});

// node_modules/@stdlib/math-base-special-erf/lib/polyval_qa.js
var require_polyval_qa = __commonJS({
  "node_modules/@stdlib/math-base-special-erf/lib/polyval_qa.js"(exports, module) {
    "use strict";
    function evalpoly(x) {
      if (x === 0) {
        return 0.10642088040084423;
      }
      return 0.10642088040084423 + x * (0.540397917702171 + x * (0.07182865441419627 + x * (0.12617121980876164 + x * (0.01363708391202905 + x * 0.011984499846799107))));
    }
    module.exports = evalpoly;
  }
});

// node_modules/@stdlib/math-base-special-erf/lib/polyval_ra.js
var require_polyval_ra = __commonJS({
  "node_modules/@stdlib/math-base-special-erf/lib/polyval_ra.js"(exports, module) {
    "use strict";
    function evalpoly(x) {
      if (x === 0) {
        return -0.6938585727071818;
      }
      return -0.6938585727071818 + x * (-10.558626225323291 + x * (-62.375332450326006 + x * (-162.39666946257347 + x * (-184.60509290671104 + x * (-81.2874355063066 + x * -9.814329344169145)))));
    }
    module.exports = evalpoly;
  }
});

// node_modules/@stdlib/math-base-special-erf/lib/polyval_sa.js
var require_polyval_sa = __commonJS({
  "node_modules/@stdlib/math-base-special-erf/lib/polyval_sa.js"(exports, module) {
    "use strict";
    function evalpoly(x) {
      if (x === 0) {
        return 19.651271667439257;
      }
      return 19.651271667439257 + x * (137.65775414351904 + x * (434.56587747522923 + x * (645.3872717332679 + x * (429.00814002756783 + x * (108.63500554177944 + x * (6.570249770319282 + x * -0.0604244152148581))))));
    }
    module.exports = evalpoly;
  }
});

// node_modules/@stdlib/math-base-special-erf/lib/polyval_rb.js
var require_polyval_rb = __commonJS({
  "node_modules/@stdlib/math-base-special-erf/lib/polyval_rb.js"(exports, module) {
    "use strict";
    function evalpoly(x) {
      if (x === 0) {
        return -0.799283237680523;
      }
      return -0.799283237680523 + x * (-17.757954917754752 + x * (-160.63638485582192 + x * (-637.5664433683896 + x * (-1025.0951316110772 + x * -483.5191916086514))));
    }
    module.exports = evalpoly;
  }
});

// node_modules/@stdlib/math-base-special-erf/lib/polyval_sb.js
var require_polyval_sb = __commonJS({
  "node_modules/@stdlib/math-base-special-erf/lib/polyval_sb.js"(exports, module) {
    "use strict";
    function evalpoly(x) {
      if (x === 0) {
        return 30.33806074348246;
      }
      return 30.33806074348246 + x * (325.7925129965739 + x * (1536.729586084437 + x * (3199.8582195085955 + x * (2553.0504064331644 + x * (474.52854120695537 + x * -22.44095244658582)))));
    }
    module.exports = evalpoly;
  }
});

// node_modules/@stdlib/math-base-special-erf/lib/main.js
var require_main39 = __commonJS({
  "node_modules/@stdlib/math-base-special-erf/lib/main.js"(exports, module) {
    "use strict";
    var isnan = require_lib();
    var exp = require_lib51();
    var setLowWord = require_lib52();
    var PINF = require_lib7();
    var NINF = require_lib6();
    var polyvalPP = require_polyval_pp();
    var polyvalQQ = require_polyval_qq();
    var polyvalPA = require_polyval_pa();
    var polyvalQA = require_polyval_qa();
    var polyvalRA = require_polyval_ra();
    var polyvalSA = require_polyval_sa();
    var polyvalRB = require_polyval_rb();
    var polyvalSB = require_polyval_sb();
    var TINY = 1e-300;
    var VERY_TINY = 2848094538889218e-321;
    var SMALL = 3725290298461914e-24;
    var ERX = 0.8450629115104675;
    var EFX = 0.1283791670955126;
    var EFX8 = 1.0270333367641007;
    var PPC = 0.12837916709551256;
    var QQC = 1;
    var PAC = -0.0023621185607526594;
    var QAC = 1;
    var RAC = -0.009864944034847148;
    var SAC = 1;
    var RBC = -0.0098649429247001;
    var SBC = 1;
    function erf2(x) {
      var sign;
      var ax;
      var z;
      var r;
      var s;
      var y;
      var p;
      var q;
      if (isnan(x)) {
        return NaN;
      }
      if (x === PINF) {
        return 1;
      }
      if (x === NINF) {
        return -1;
      }
      if (x === 0) {
        return x;
      }
      if (x < 0) {
        sign = true;
        ax = -x;
      } else {
        sign = false;
        ax = x;
      }
      if (ax < 0.84375) {
        if (ax < SMALL) {
          if (ax < VERY_TINY) {
            return 0.125 * (8 * x + EFX8 * x);
          }
          return x + EFX * x;
        }
        z = x * x;
        r = PPC + z * polyvalPP(z);
        s = QQC + z * polyvalQQ(z);
        y = r / s;
        return x + x * y;
      }
      if (ax < 1.25) {
        s = ax - 1;
        p = PAC + s * polyvalPA(s);
        q = QAC + s * polyvalQA(s);
        if (sign) {
          return -ERX - p / q;
        }
        return ERX + p / q;
      }
      if (ax >= 6) {
        if (sign) {
          return TINY - 1;
        }
        return 1 - TINY;
      }
      s = 1 / (ax * ax);
      if (ax < 2.857142857142857) {
        r = RAC + s * polyvalRA(s);
        s = SAC + s * polyvalSA(s);
      } else {
        r = RBC + s * polyvalRB(s);
        s = SBC + s * polyvalSB(s);
      }
      z = setLowWord(ax, 0);
      r = exp(-(z * z) - 0.5625) * exp((z - ax) * (z + ax) + r / s);
      if (sign) {
        return r / ax - 1;
      }
      return 1 - r / ax;
    }
    module.exports = erf2;
  }
});

// node_modules/@stdlib/math-base-special-erf/lib/index.js
var require_lib53 = __commonJS({
  "node_modules/@stdlib/math-base-special-erf/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main39();
    module.exports = main;
  }
});

// node_modules/@stdlib/math-base-special-sqrt/lib/main.js
var require_main40 = __commonJS({
  "node_modules/@stdlib/math-base-special-sqrt/lib/main.js"(exports, module) {
    "use strict";
    var sqrt = Math.sqrt;
    module.exports = sqrt;
  }
});

// node_modules/@stdlib/math-base-special-sqrt/lib/index.js
var require_lib54 = __commonJS({
  "node_modules/@stdlib/math-base-special-sqrt/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main40();
    module.exports = main;
  }
});

// node_modules/@stdlib/number-float64-base-set-high-word/lib/high.js
var require_high2 = __commonJS({
  "node_modules/@stdlib/number-float64-base-set-high-word/lib/high.js"(exports, module) {
    "use strict";
    var isLittleEndian = require_lib40();
    var HIGH;
    if (isLittleEndian === true) {
      HIGH = 1;
    } else {
      HIGH = 0;
    }
    module.exports = HIGH;
  }
});

// node_modules/@stdlib/number-float64-base-set-high-word/lib/main.js
var require_main41 = __commonJS({
  "node_modules/@stdlib/number-float64-base-set-high-word/lib/main.js"(exports, module) {
    "use strict";
    var Uint32Array2 = require_lib28();
    var Float64Array2 = require_lib31();
    var HIGH = require_high2();
    var FLOAT64_VIEW = new Float64Array2(1);
    var UINT32_VIEW = new Uint32Array2(FLOAT64_VIEW.buffer);
    function setHighWord(x, high) {
      FLOAT64_VIEW[0] = x;
      UINT32_VIEW[HIGH] = high >>> 0;
      return FLOAT64_VIEW[0];
    }
    module.exports = setHighWord;
  }
});

// node_modules/@stdlib/number-float64-base-set-high-word/lib/index.js
var require_lib55 = __commonJS({
  "node_modules/@stdlib/number-float64-base-set-high-word/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main41();
    module.exports = main;
  }
});

// node_modules/@stdlib/math-base-special-ln/lib/polyval_p.js
var require_polyval_p2 = __commonJS({
  "node_modules/@stdlib/math-base-special-ln/lib/polyval_p.js"(exports, module) {
    "use strict";
    function evalpoly(x) {
      if (x === 0) {
        return 0.3999999999940942;
      }
      return 0.3999999999940942 + x * (0.22222198432149784 + x * 0.15313837699209373);
    }
    module.exports = evalpoly;
  }
});

// node_modules/@stdlib/math-base-special-ln/lib/polyval_q.js
var require_polyval_q = __commonJS({
  "node_modules/@stdlib/math-base-special-ln/lib/polyval_q.js"(exports, module) {
    "use strict";
    function evalpoly(x) {
      if (x === 0) {
        return 0.6666666666666735;
      }
      return 0.6666666666666735 + x * (0.2857142874366239 + x * (0.1818357216161805 + x * 0.14798198605116586));
    }
    module.exports = evalpoly;
  }
});

// node_modules/@stdlib/math-base-special-ln/lib/main.js
var require_main42 = __commonJS({
  "node_modules/@stdlib/math-base-special-ln/lib/main.js"(exports, module) {
    "use strict";
    var getHighWord = require_lib42();
    var setHighWord = require_lib55();
    var isnan = require_lib();
    var BIAS = require_lib8();
    var NINF = require_lib6();
    var polyvalP = require_polyval_p2();
    var polyvalQ = require_polyval_q();
    var LN2_HI = 0.6931471803691238;
    var LN2_LO = 19082149292705877e-26;
    var TWO54 = 18014398509481984;
    var ONE_THIRD = 0.3333333333333333;
    var HIGH_SIGNIFICAND_MASK = 1048575 | 0;
    var HIGH_MAX_NORMAL_EXP = 2146435072 | 0;
    var HIGH_MIN_NORMAL_EXP = 1048576 | 0;
    var HIGH_BIASED_EXP_0 = 1072693248 | 0;
    function ln(x) {
      var hfsq;
      var hx;
      var t2;
      var t1;
      var k;
      var R;
      var f;
      var i;
      var j;
      var s;
      var w;
      var z;
      if (x === 0) {
        return NINF;
      }
      if (isnan(x) || x < 0) {
        return NaN;
      }
      hx = getHighWord(x);
      k = 0 | 0;
      if (hx < HIGH_MIN_NORMAL_EXP) {
        k -= 54 | 0;
        x *= TWO54;
        hx = getHighWord(x);
      }
      if (hx >= HIGH_MAX_NORMAL_EXP) {
        return x + x;
      }
      k += (hx >> 20) - BIAS | 0;
      hx &= HIGH_SIGNIFICAND_MASK;
      i = hx + 614244 & 1048576 | 0;
      x = setHighWord(x, hx | i ^ HIGH_BIASED_EXP_0);
      k += i >> 20 | 0;
      f = x - 1;
      if ((HIGH_SIGNIFICAND_MASK & 2 + hx) < 3) {
        if (f === 0) {
          if (k === 0) {
            return 0;
          }
          return k * LN2_HI + k * LN2_LO;
        }
        R = f * f * (0.5 - ONE_THIRD * f);
        if (k === 0) {
          return f - R;
        }
        return k * LN2_HI - (R - k * LN2_LO - f);
      }
      s = f / (2 + f);
      z = s * s;
      i = hx - 398458 | 0;
      w = z * z;
      j = 440401 - hx | 0;
      t1 = w * polyvalP(w);
      t2 = z * polyvalQ(w);
      i |= j;
      R = t2 + t1;
      if (i > 0) {
        hfsq = 0.5 * f * f;
        if (k === 0) {
          return f - (hfsq - s * (hfsq + R));
        }
        return k * LN2_HI - (hfsq - (s * (hfsq + R) + k * LN2_LO) - f);
      }
      if (k === 0) {
        return f - s * (f - R);
      }
      return k * LN2_HI - (s * (f - R) - k * LN2_LO - f);
    }
    module.exports = ln;
  }
});

// node_modules/@stdlib/math-base-special-ln/lib/index.js
var require_lib56 = __commonJS({
  "node_modules/@stdlib/math-base-special-ln/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main42();
    module.exports = main;
  }
});

// node_modules/@stdlib/math-base-special-erfinv/lib/rational_p1q1.js
var require_rational_p1q1 = __commonJS({
  "node_modules/@stdlib/math-base-special-erfinv/lib/rational_p1q1.js"(exports, module) {
    "use strict";
    function evalrational(x) {
      var ax;
      var s1;
      var s2;
      if (x === 0) {
        return -5087819496582806e-19;
      }
      if (x < 0) {
        ax = -x;
      } else {
        ax = x;
      }
      if (ax <= 1) {
        s1 = -5087819496582806e-19 + x * (-0.008368748197417368 + x * (0.03348066254097446 + x * (-0.012692614766297404 + x * (-0.03656379714117627 + x * (0.02198786811111689 + x * (0.008226878746769157 + x * (-0.005387729650712429 + x * (0 + x * 0))))))));
        s2 = 1 + x * (-0.9700050433032906 + x * (-1.5657455823417585 + x * (1.5622155839842302 + x * (0.662328840472003 + x * (-0.7122890234154284 + x * (-0.05273963823400997 + x * (0.07952836873415717 + x * (-0.0023339375937419 + x * 8862163904564247e-19))))))));
      } else {
        x = 1 / x;
        s1 = 0 + x * (0 + x * (-0.005387729650712429 + x * (0.008226878746769157 + x * (0.02198786811111689 + x * (-0.03656379714117627 + x * (-0.012692614766297404 + x * (0.03348066254097446 + x * (-0.008368748197417368 + x * -5087819496582806e-19))))))));
        s2 = 8862163904564247e-19 + x * (-0.0023339375937419 + x * (0.07952836873415717 + x * (-0.05273963823400997 + x * (-0.7122890234154284 + x * (0.662328840472003 + x * (1.5622155839842302 + x * (-1.5657455823417585 + x * (-0.9700050433032906 + x * 1))))))));
      }
      return s1 / s2;
    }
    module.exports = evalrational;
  }
});

// node_modules/@stdlib/math-base-special-erfinv/lib/rational_p2q2.js
var require_rational_p2q2 = __commonJS({
  "node_modules/@stdlib/math-base-special-erfinv/lib/rational_p2q2.js"(exports, module) {
    "use strict";
    function evalrational(x) {
      var ax;
      var s1;
      var s2;
      if (x === 0) {
        return -0.20243350835593876;
      }
      if (x < 0) {
        ax = -x;
      } else {
        ax = x;
      }
      if (ax <= 1) {
        s1 = -0.20243350835593876 + x * (0.10526468069939171 + x * (8.3705032834312 + x * (17.644729840837403 + x * (-18.851064805871424 + x * (-44.6382324441787 + x * (17.445385985570866 + x * (21.12946554483405 + x * -3.6719225470772936)))))));
        s2 = 1 + x * (6.242641248542475 + x * (3.971343795334387 + x * (-28.66081804998 + x * (-20.14326346804852 + x * (48.560921310873994 + x * (10.826866735546016 + x * (-22.643693341313973 + x * 1.7211476576120028)))))));
      } else {
        x = 1 / x;
        s1 = -3.6719225470772936 + x * (21.12946554483405 + x * (17.445385985570866 + x * (-44.6382324441787 + x * (-18.851064805871424 + x * (17.644729840837403 + x * (8.3705032834312 + x * (0.10526468069939171 + x * -0.20243350835593876)))))));
        s2 = 1.7211476576120028 + x * (-22.643693341313973 + x * (10.826866735546016 + x * (48.560921310873994 + x * (-20.14326346804852 + x * (-28.66081804998 + x * (3.971343795334387 + x * (6.242641248542475 + x * 1)))))));
      }
      return s1 / s2;
    }
    module.exports = evalrational;
  }
});

// node_modules/@stdlib/math-base-special-erfinv/lib/rational_p3q3.js
var require_rational_p3q3 = __commonJS({
  "node_modules/@stdlib/math-base-special-erfinv/lib/rational_p3q3.js"(exports, module) {
    "use strict";
    function evalrational(x) {
      var ax;
      var s1;
      var s2;
      if (x === 0) {
        return -0.1311027816799519;
      }
      if (x < 0) {
        ax = -x;
      } else {
        ax = x;
      }
      if (ax <= 1) {
        s1 = -0.1311027816799519 + x * (-0.16379404719331705 + x * (0.11703015634199525 + x * (0.38707973897260434 + x * (0.3377855389120359 + x * (0.14286953440815717 + x * (0.029015791000532906 + x * (0.0021455899538880526 + x * (-6794655751811263e-22 + x * (28522533178221704e-24 + x * -681149956853777e-24)))))))));
        s2 = 1 + x * (3.4662540724256723 + x * (5.381683457070069 + x * (4.778465929458438 + x * (2.5930192162362027 + x * (0.848854343457902 + x * (0.15226433829533179 + x * (0.011059242293464892 + x * (0 + x * (0 + x * 0)))))))));
      } else {
        x = 1 / x;
        s1 = -681149956853777e-24 + x * (28522533178221704e-24 + x * (-6794655751811263e-22 + x * (0.0021455899538880526 + x * (0.029015791000532906 + x * (0.14286953440815717 + x * (0.3377855389120359 + x * (0.38707973897260434 + x * (0.11703015634199525 + x * (-0.16379404719331705 + x * -0.1311027816799519)))))))));
        s2 = 0 + x * (0 + x * (0 + x * (0.011059242293464892 + x * (0.15226433829533179 + x * (0.848854343457902 + x * (2.5930192162362027 + x * (4.778465929458438 + x * (5.381683457070069 + x * (3.4662540724256723 + x * 1)))))))));
      }
      return s1 / s2;
    }
    module.exports = evalrational;
  }
});

// node_modules/@stdlib/math-base-special-erfinv/lib/rational_p4q4.js
var require_rational_p4q4 = __commonJS({
  "node_modules/@stdlib/math-base-special-erfinv/lib/rational_p4q4.js"(exports, module) {
    "use strict";
    function evalrational(x) {
      var ax;
      var s1;
      var s2;
      if (x === 0) {
        return -0.0350353787183178;
      }
      if (x < 0) {
        ax = -x;
      } else {
        ax = x;
      }
      if (ax <= 1) {
        s1 = -0.0350353787183178 + x * (-0.0022242652921344794 + x * (0.018557330651423107 + x * (0.009508047013259196 + x * (0.0018712349281955923 + x * (15754461742496055e-20 + x * (460469890584318e-20 + x * (-2304047769118826e-25 + x * 26633922742578204e-28)))))));
        s2 = 1 + x * (1.3653349817554064 + x * (0.7620591645536234 + x * (0.22009110576413124 + x * (0.03415891436709477 + x * (0.00263861676657016 + x * (7646752923027944e-20 + x * (0 + x * 0)))))));
      } else {
        x = 1 / x;
        s1 = 26633922742578204e-28 + x * (-2304047769118826e-25 + x * (460469890584318e-20 + x * (15754461742496055e-20 + x * (0.0018712349281955923 + x * (0.009508047013259196 + x * (0.018557330651423107 + x * (-0.0022242652921344794 + x * -0.0350353787183178)))))));
        s2 = 0 + x * (0 + x * (7646752923027944e-20 + x * (0.00263861676657016 + x * (0.03415891436709477 + x * (0.22009110576413124 + x * (0.7620591645536234 + x * (1.3653349817554064 + x * 1)))))));
      }
      return s1 / s2;
    }
    module.exports = evalrational;
  }
});

// node_modules/@stdlib/math-base-special-erfinv/lib/rational_p5q5.js
var require_rational_p5q5 = __commonJS({
  "node_modules/@stdlib/math-base-special-erfinv/lib/rational_p5q5.js"(exports, module) {
    "use strict";
    function evalrational(x) {
      var ax;
      var s1;
      var s2;
      if (x === 0) {
        return -0.016743100507663373;
      }
      if (x < 0) {
        ax = -x;
      } else {
        ax = x;
      }
      if (ax <= 1) {
        s1 = -0.016743100507663373 + x * (-0.0011295143874558028 + x * (0.001056288621524929 + x * (20938631748758808e-20 + x * (14962478375834237e-21 + x * (44969678992770644e-23 + x * (4625961635228786e-24 + x * (-2811287356288318e-29 + x * 9905570997331033e-32)))))));
        s2 = 1 + x * (0.5914293448864175 + x * (0.1381518657490833 + x * (0.016074608709367652 + x * (9640118070051656e-19 + x * (27533547476472603e-21 + x * (282243172016108e-21 + x * (0 + x * 0)))))));
      } else {
        x = 1 / x;
        s1 = 9905570997331033e-32 + x * (-2811287356288318e-29 + x * (4625961635228786e-24 + x * (44969678992770644e-23 + x * (14962478375834237e-21 + x * (20938631748758808e-20 + x * (0.001056288621524929 + x * (-0.0011295143874558028 + x * -0.016743100507663373)))))));
        s2 = 0 + x * (0 + x * (282243172016108e-21 + x * (27533547476472603e-21 + x * (9640118070051656e-19 + x * (0.016074608709367652 + x * (0.1381518657490833 + x * (0.5914293448864175 + x * 1)))))));
      }
      return s1 / s2;
    }
    module.exports = evalrational;
  }
});

// node_modules/@stdlib/math-base-special-erfinv/lib/main.js
var require_main43 = __commonJS({
  "node_modules/@stdlib/math-base-special-erfinv/lib/main.js"(exports, module) {
    "use strict";
    var isnan = require_lib();
    var sqrt = require_lib54();
    var ln = require_lib56();
    var PINF = require_lib7();
    var NINF = require_lib6();
    var rationalFcnR1 = require_rational_p1q1();
    var rationalFcnR2 = require_rational_p2q2();
    var rationalFcnR3 = require_rational_p3q3();
    var rationalFcnR4 = require_rational_p4q4();
    var rationalFcnR5 = require_rational_p5q5();
    var Y1 = 0.08913147449493408;
    var Y2 = 2.249481201171875;
    var Y3 = 0.807220458984375;
    var Y4 = 0.9399557113647461;
    var Y5 = 0.9836282730102539;
    function erfinv(x) {
      var sign;
      var ax;
      var qs;
      var q;
      var g;
      var r;
      if (isnan(x)) {
        return NaN;
      }
      if (x === 1) {
        return PINF;
      }
      if (x === -1) {
        return NINF;
      }
      if (x === 0) {
        return x;
      }
      if (x > 1 || x < -1) {
        return NaN;
      }
      if (x < 0) {
        sign = -1;
        ax = -x;
      } else {
        sign = 1;
        ax = x;
      }
      q = 1 - ax;
      if (ax <= 0.5) {
        g = ax * (ax + 10);
        r = rationalFcnR1(ax);
        return sign * (g * Y1 + g * r);
      }
      if (q >= 0.25) {
        g = sqrt(-2 * ln(q));
        q -= 0.25;
        r = rationalFcnR2(q);
        return sign * (g / (Y2 + r));
      }
      q = sqrt(-ln(q));
      if (q < 3) {
        qs = q - 1.125;
        r = rationalFcnR3(qs);
        return sign * (Y3 * q + r * q);
      }
      if (q < 6) {
        qs = q - 3;
        r = rationalFcnR4(qs);
        return sign * (Y4 * q + r * q);
      }
      qs = q - 6;
      r = rationalFcnR5(qs);
      return sign * (Y5 * q + r * q);
    }
    module.exports = erfinv;
  }
});

// node_modules/@stdlib/math-base-special-erfinv/lib/index.js
var require_lib57 = __commonJS({
  "node_modules/@stdlib/math-base-special-erfinv/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main43();
    module.exports = main;
  }
});

// node_modules/@stdlib/stats-base-dists-normal-quantile/lib/main.js
var require_main44 = __commonJS({
  "node_modules/@stdlib/stats-base-dists-normal-quantile/lib/main.js"(exports, module) {
    "use strict";
    var erfinv = require_lib57();
    var isnan = require_lib();
    var sqrt = require_lib54();
    function quantile2(p, mu, sigma) {
      var A;
      var B;
      if (isnan(mu) || isnan(sigma) || isnan(p) || sigma < 0 || p < 0 || p > 1) {
        return NaN;
      }
      if (sigma === 0) {
        return mu;
      }
      A = mu;
      B = sigma * sqrt(2);
      return A + B * erfinv(2 * p - 1);
    }
    module.exports = quantile2;
  }
});

// node_modules/@stdlib/utils-constant-function/lib/main.js
var require_main45 = __commonJS({
  "node_modules/@stdlib/utils-constant-function/lib/main.js"(exports, module) {
    "use strict";
    function wrap(value) {
      return constantFunction;
      function constantFunction() {
        return value;
      }
    }
    module.exports = wrap;
  }
});

// node_modules/@stdlib/utils-constant-function/lib/index.js
var require_lib58 = __commonJS({
  "node_modules/@stdlib/utils-constant-function/lib/index.js"(exports, module) {
    "use strict";
    var main = require_main45();
    module.exports = main;
  }
});

// node_modules/@stdlib/stats-base-dists-degenerate-quantile/lib/main.js
var require_main46 = __commonJS({
  "node_modules/@stdlib/stats-base-dists-degenerate-quantile/lib/main.js"(exports, module) {
    "use strict";
    var isnan = require_lib();
    function quantile2(p, mu) {
      if (isnan(p) || p < 0 || p > 1) {
        return NaN;
      }
      return mu;
    }
    module.exports = quantile2;
  }
});

// node_modules/@stdlib/stats-base-dists-degenerate-quantile/lib/factory.js
var require_factory = __commonJS({
  "node_modules/@stdlib/stats-base-dists-degenerate-quantile/lib/factory.js"(exports, module) {
    "use strict";
    var constantFunction = require_lib58();
    var isnan = require_lib();
    function factory(mu) {
      if (isnan(mu)) {
        return constantFunction(NaN);
      }
      return quantile2;
      function quantile2(p) {
        if (isnan(p) || p < 0 || p > 1) {
          return NaN;
        }
        return mu;
      }
    }
    module.exports = factory;
  }
});

// node_modules/@stdlib/stats-base-dists-degenerate-quantile/lib/index.js
var require_lib59 = __commonJS({
  "node_modules/@stdlib/stats-base-dists-degenerate-quantile/lib/index.js"(exports, module) {
    "use strict";
    var setReadOnly = require_lib19();
    var main = require_main46();
    var factory = require_factory();
    setReadOnly(main, "factory", factory);
    module.exports = main;
  }
});

// node_modules/@stdlib/stats-base-dists-normal-quantile/lib/factory.js
var require_factory2 = __commonJS({
  "node_modules/@stdlib/stats-base-dists-normal-quantile/lib/factory.js"(exports, module) {
    "use strict";
    var constantFunction = require_lib58();
    var degenerate = require_lib59().factory;
    var erfinv = require_lib57();
    var isnan = require_lib();
    var sqrt = require_lib54();
    function factory(mu, sigma) {
      var A;
      var B;
      if (isnan(mu) || isnan(sigma) || sigma < 0) {
        return constantFunction(NaN);
      }
      if (sigma === 0) {
        degenerate(mu);
      }
      A = mu;
      B = sigma * sqrt(2);
      return quantile2;
      function quantile2(p) {
        if (isnan(p) || p < 0 || p > 1) {
          return NaN;
        }
        return A + B * erfinv(2 * p - 1);
      }
    }
    module.exports = factory;
  }
});

// node_modules/@stdlib/stats-base-dists-normal-quantile/lib/index.js
var require_lib60 = __commonJS({
  "node_modules/@stdlib/stats-base-dists-normal-quantile/lib/index.js"(exports, module) {
    "use strict";
    var setReadOnly = require_lib19();
    var main = require_main44();
    var factory = require_factory2();
    setReadOnly(main, "factory", factory);
    module.exports = main;
  }
});

// node_modules/ramda/es/internal/_isPlaceholder.js
function _isPlaceholder(a) {
  return a != null && typeof a === "object" && a["@@functional/placeholder"] === true;
}

// node_modules/ramda/es/internal/_curry1.js
function _curry1(fn) {
  return function f1(a) {
    if (arguments.length === 0 || _isPlaceholder(a)) {
      return f1;
    } else {
      return fn.apply(this, arguments);
    }
  };
}

// node_modules/ramda/es/internal/_curry2.js
function _curry2(fn) {
  return function f2(a, b) {
    switch (arguments.length) {
      case 0:
        return f2;
      case 1:
        return _isPlaceholder(a) ? f2 : _curry1(function(_b) {
          return fn(a, _b);
        });
      default:
        return _isPlaceholder(a) && _isPlaceholder(b) ? f2 : _isPlaceholder(a) ? _curry1(function(_a) {
          return fn(_a, b);
        }) : _isPlaceholder(b) ? _curry1(function(_b) {
          return fn(a, _b);
        }) : fn(a, b);
    }
  };
}

// node_modules/ramda/es/internal/_arity.js
function _arity(n, fn) {
  switch (n) {
    case 0:
      return function() {
        return fn.apply(this, arguments);
      };
    case 1:
      return function(a0) {
        return fn.apply(this, arguments);
      };
    case 2:
      return function(a0, a1) {
        return fn.apply(this, arguments);
      };
    case 3:
      return function(a0, a1, a2) {
        return fn.apply(this, arguments);
      };
    case 4:
      return function(a0, a1, a2, a3) {
        return fn.apply(this, arguments);
      };
    case 5:
      return function(a0, a1, a2, a3, a4) {
        return fn.apply(this, arguments);
      };
    case 6:
      return function(a0, a1, a2, a3, a4, a5) {
        return fn.apply(this, arguments);
      };
    case 7:
      return function(a0, a1, a2, a3, a4, a5, a6) {
        return fn.apply(this, arguments);
      };
    case 8:
      return function(a0, a1, a2, a3, a4, a5, a6, a7) {
        return fn.apply(this, arguments);
      };
    case 9:
      return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {
        return fn.apply(this, arguments);
      };
    case 10:
      return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
        return fn.apply(this, arguments);
      };
    default:
      throw new Error("First argument to _arity must be a non-negative integer no greater than ten");
  }
}

// node_modules/ramda/es/internal/_curry3.js
function _curry3(fn) {
  return function f3(a, b, c) {
    switch (arguments.length) {
      case 0:
        return f3;
      case 1:
        return _isPlaceholder(a) ? f3 : _curry2(function(_b, _c) {
          return fn(a, _b, _c);
        });
      case 2:
        return _isPlaceholder(a) && _isPlaceholder(b) ? f3 : _isPlaceholder(a) ? _curry2(function(_a, _c) {
          return fn(_a, b, _c);
        }) : _isPlaceholder(b) ? _curry2(function(_b, _c) {
          return fn(a, _b, _c);
        }) : _curry1(function(_c) {
          return fn(a, b, _c);
        });
      default:
        return _isPlaceholder(a) && _isPlaceholder(b) && _isPlaceholder(c) ? f3 : _isPlaceholder(a) && _isPlaceholder(b) ? _curry2(function(_a, _b) {
          return fn(_a, _b, c);
        }) : _isPlaceholder(a) && _isPlaceholder(c) ? _curry2(function(_a, _c) {
          return fn(_a, b, _c);
        }) : _isPlaceholder(b) && _isPlaceholder(c) ? _curry2(function(_b, _c) {
          return fn(a, _b, _c);
        }) : _isPlaceholder(a) ? _curry1(function(_a) {
          return fn(_a, b, c);
        }) : _isPlaceholder(b) ? _curry1(function(_b) {
          return fn(a, _b, c);
        }) : _isPlaceholder(c) ? _curry1(function(_c) {
          return fn(a, b, _c);
        }) : fn(a, b, c);
    }
  };
}

// node_modules/ramda/es/internal/_isArray.js
var isArray_default = Array.isArray || function _isArray(val) {
  return val != null && val.length >= 0 && Object.prototype.toString.call(val) === "[object Array]";
};

// node_modules/ramda/es/internal/_isString.js
function _isString(x) {
  return Object.prototype.toString.call(x) === "[object String]";
}

// node_modules/ramda/es/internal/_isArrayLike.js
var _isArrayLike = /* @__PURE__ */ _curry1(function isArrayLike(x) {
  if (isArray_default(x)) {
    return true;
  }
  if (!x) {
    return false;
  }
  if (typeof x !== "object") {
    return false;
  }
  if (_isString(x)) {
    return false;
  }
  if (x.length === 0) {
    return true;
  }
  if (x.length > 0) {
    return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
  }
  return false;
});
var isArrayLike_default = _isArrayLike;

// node_modules/ramda/es/internal/_createReduce.js
var symIterator = typeof Symbol !== "undefined" ? Symbol.iterator : "@@iterator";
function _createReduce(arrayReduce, methodReduce, iterableReduce) {
  return function _reduce(xf, acc, list) {
    if (isArrayLike_default(list)) {
      return arrayReduce(xf, acc, list);
    }
    if (list == null) {
      return acc;
    }
    if (typeof list["fantasy-land/reduce"] === "function") {
      return methodReduce(xf, acc, list, "fantasy-land/reduce");
    }
    if (list[symIterator] != null) {
      return iterableReduce(xf, acc, list[symIterator]());
    }
    if (typeof list.next === "function") {
      return iterableReduce(xf, acc, list);
    }
    if (typeof list.reduce === "function") {
      return methodReduce(xf, acc, list, "reduce");
    }
    throw new TypeError("reduce: list must be array or iterable");
  };
}

// node_modules/ramda/es/internal/_xArrayReduce.js
function _xArrayReduce(xf, acc, list) {
  var idx = 0;
  var len = list.length;
  while (idx < len) {
    acc = xf["@@transducer/step"](acc, list[idx]);
    if (acc && acc["@@transducer/reduced"]) {
      acc = acc["@@transducer/value"];
      break;
    }
    idx += 1;
  }
  return xf["@@transducer/result"](acc);
}

// node_modules/ramda/es/bind.js
var bind = /* @__PURE__ */ _curry2(function bind2(fn, thisObj) {
  return _arity(fn.length, function() {
    return fn.apply(thisObj, arguments);
  });
});
var bind_default = bind;

// node_modules/ramda/es/internal/_xReduce.js
function _xIterableReduce(xf, acc, iter) {
  var step = iter.next();
  while (!step.done) {
    acc = xf["@@transducer/step"](acc, step.value);
    if (acc && acc["@@transducer/reduced"]) {
      acc = acc["@@transducer/value"];
      break;
    }
    step = iter.next();
  }
  return xf["@@transducer/result"](acc);
}
function _xMethodReduce(xf, acc, obj, methodName) {
  return xf["@@transducer/result"](obj[methodName](bind_default(xf["@@transducer/step"], xf), acc));
}
var _xReduce = /* @__PURE__ */ _createReduce(_xArrayReduce, _xMethodReduce, _xIterableReduce);
var xReduce_default = _xReduce;

// node_modules/ramda/es/internal/_xwrap.js
var XWrap = /* @__PURE__ */ (function() {
  function XWrap2(fn) {
    this.f = fn;
  }
  XWrap2.prototype["@@transducer/init"] = function() {
    throw new Error("init not implemented on XWrap");
  };
  XWrap2.prototype["@@transducer/result"] = function(acc) {
    return acc;
  };
  XWrap2.prototype["@@transducer/step"] = function(acc, x) {
    return this.f(acc, x);
  };
  return XWrap2;
})();
function _xwrap(fn) {
  return new XWrap(fn);
}

// node_modules/ramda/es/reduce.js
var reduce = /* @__PURE__ */ _curry3(function(xf, acc, list) {
  return xReduce_default(typeof xf === "function" ? _xwrap(xf) : xf, acc, list);
});
var reduce_default = reduce;

// node_modules/ramda/es/internal/_identity.js
function _identity(x) {
  return x;
}

// node_modules/ramda/es/identity.js
var identity = /* @__PURE__ */ _curry1(_identity);
var identity_default = identity;

// node_modules/ramda/es/internal/_isNumber.js
function _isNumber(x) {
  return Object.prototype.toString.call(x) === "[object Number]";
}

// node_modules/ramda/es/range.js
var range = /* @__PURE__ */ _curry2(function range2(from, to) {
  if (!(_isNumber(from) && _isNumber(to))) {
    throw new TypeError("Both arguments to range must be numbers");
  }
  var length = from < to ? Math.ceil(to - from) : 0;
  var result = Array(length);
  var idx = 0;
  while (idx < length) {
    result[idx] = idx + from;
    idx += 1;
  }
  return result;
});
var range_default = range;

// node_modules/ramda/es/sortBy.js
var sortBy = /* @__PURE__ */ _curry2(function sortBy2(fn, list) {
  return Array.prototype.slice.call(list, 0).sort(function(a, b) {
    var aa = fn(a);
    var bb = fn(b);
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  });
});
var sortBy_default = sortBy;

// node_modules/sort-unwind/dist/index.js
var curried = (rank) => (src) => {
  if (src.length === 0) return [[], []];
  const zipped = [];
  src.forEach((_, i) => {
    zipped.push([rank[i], i, src[i]]);
  });
  zipped.sort(([a], [b]) => a - b);
  const dst = [];
  const derank = [];
  zipped.forEach(([_, i, o]) => {
    derank.push(i);
    dst.push(o);
  });
  return [dst, derank];
};
var unwind = (rank, src) => curried(rank)(src);

// node_modules/openskill/dist/index.js
var import_math_base_special_erf = __toESM(require_lib53(), 1);
var import_stats_base_dists_normal_quantile = __toESM(require_lib60(), 1);
var __defProp2 = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp2.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var builder = (options) => {
  const { z = 3, mu = 25, epsilon = 0.1, alpha = 1, target = 0 } = options;
  const { tau = 25 / 300, sigma = 25 / 3, beta = 25 / 6, limitSigma = false } = options;
  const { balance = false, kappa = 1e-4 } = options;
  const betaSq = beta ** 2;
  return {
    SIGMA: sigma,
    MU: mu,
    EPSILON: epsilon,
    TWOBETASQ: 2 * betaSq,
    BETA: beta,
    BETASQ: betaSq,
    Z: z,
    ALPHA: alpha,
    TARGET: target,
    TAU: tau,
    LIMIT_SIGMA: limitSigma,
    BALANCE: balance,
    KAPPA: kappa
  };
};
var constants_default = builder;
var rating = (init, options = {}) => {
  const { MU: mu, SIGMA: sigma } = constants_default(__spreadValues(__spreadValues({}, options), init));
  return { mu, sigma };
};
var rating_default = rating;
var marginAmp = (absDiff, margin) => Math.log1p(Math.max(0, absDiff - margin));
var marginFactor = (scores, i, margin) => {
  const n = scores.length;
  if (n <= 1) return 1;
  const si = scores[i];
  const sum2 = scores.reduce((acc, sj, j) => j === i ? acc : acc + marginAmp(Math.abs(si - sj), margin), 0);
  return 1 + sum2 / (n - 1);
};
var sum = (a, b) => a + b;
var rankings = (teams, rank = []) => {
  const teamScores = teams.map((_, i) => {
    var _a;
    return (_a = rank[i]) != null ? _a : i;
  });
  const outRank = new Array(teams.length);
  let s = 0;
  for (let j = 0; j < teamScores.length; j += 1) {
    if (j > 0 && teamScores[j - 1] < teamScores[j]) {
      s = j;
    }
    outRank[j] = s;
  }
  return outRank;
};
var teamRating = (options) => (game) => {
  const { Z, ALPHA, TARGET, BALANCE, KAPPA } = constants_default(options);
  const rank = rankings(game, options.rank);
  return game.map((team, i) => {
    if (!BALANCE) {
      const { mu: muSum2, sigSq: sigSq2 } = team.reduce(
        (a, { mu, sigma }) => {
          a.mu += mu;
          a.sigSq += sigma * sigma;
          return a;
        },
        { mu: 0, sigSq: 0 }
      );
      return [muSum2, sigSq2, team, rank[i]];
    }
    const ordinals = team.map(({ mu, sigma }) => TARGET + ALPHA * (mu - Z * sigma));
    const maxOrdinal = Math.max(...ordinals);
    const denom = maxOrdinal + KAPPA;
    const { mu: muSum, sigSq } = team.reduce(
      (a, { mu, sigma }, j) => {
        const factor = 1 + (maxOrdinal - ordinals[j]) / denom;
        a.mu += mu * factor;
        const s = sigma * factor;
        a.sigSq += s * s;
        return a;
      },
      { mu: 0, sigSq: 0 }
    );
    return [muSum, sigSq, team, rank[i]];
  });
};
var utilC = (options) => {
  const { BETASQ } = constants_default(options);
  return (teamRatings) => Math.sqrt(teamRatings.map(([_teamMu, teamSigmaSq, _team, _rank]) => teamSigmaSq + BETASQ).reduce(sum, 0));
};
var utilSumQ = (teamRatings, c) => teamRatings.map(
  ([_qMu, _qSigmaSq, _qTeam, qRank]) => teamRatings.filter(([_iMu, _iSigmaSq, _iTeam, iRank]) => iRank >= qRank).map(([iMu, _iSigmaSq, _iTeam, _iRank]) => Math.exp(iMu / c)).reduce(sum, 0)
);
var utilA = (teamRatings) => teamRatings.map(
  ([_iMu, _iSigmaSq, _iTeam, iRank]) => teamRatings.filter(([_qMu, _qSigmaSq, _qTeam, qRank]) => iRank === qRank).length
);
var defaultGamma = (c, _k, _mu, sigmaSq, _team, _qRank) => Math.sqrt(sigmaSq) / c;
var gamma = (options) => {
  var _a;
  return (_a = options.gamma) != null ? _a : defaultGamma;
};
var util_default = (options) => ({
  utilC: utilC(options),
  teamRating: teamRating(options),
  gamma: gamma(options)
});
var model = (game, options = {}) => {
  const { KAPPA } = constants_default(options);
  const { utilC: utilC2, teamRating: teamRating2, gamma: gamma2 } = util_default(options);
  const teamRatings = teamRating2(game);
  const c = utilC2(teamRatings);
  const sumQ = utilSumQ(teamRatings, c);
  const a = utilA(teamRatings);
  return teamRatings.map((iTeamRating, i) => {
    const [iMu, iSigmaSq, iTeam, iRank] = iTeamRating;
    const iMuOverCe = Math.exp(iMu / c);
    const { omega: omegaSum, delta: deltaSum } = teamRatings.reduce(
      (acc, [_qMu, _qSigmaSq, _qTeam, qRank], q) => {
        if (qRank > iRank) return acc;
        const quotient = iMuOverCe / sumQ[q];
        acc.omega += (i === q ? 1 - quotient : -quotient) / a[q];
        acc.delta += quotient * (1 - quotient) / a[q];
        return acc;
      },
      { omega: 0, delta: 0 }
    );
    const iGamma = gamma2(c, teamRatings.length, ...iTeamRating);
    const iOmega = omegaSum * (iSigmaSq / c);
    const iDelta = deltaSum * (iSigmaSq / c ** 2) * iGamma;
    return iTeam.map(({ mu, sigma }) => ({
      mu: mu + sigma ** 2 / iSigmaSq * iOmega,
      sigma: sigma * Math.sqrt(Math.max(1 - sigma ** 2 / iSigmaSq * iDelta, KAPPA))
    }));
  });
};
var plackett_luce_default = model;
var SQRT_2 = Math.sqrt(2);
var SQRT_TAU = Math.sqrt(2 * Math.PI);
var phiMajor = (x) => 0.5 * (1 + (0, import_math_base_special_erf.default)(x / SQRT_2));
var rate = (teams, options = {}) => {
  var _a, _b, _c;
  const { LIMIT_SIGMA, TAU } = constants_default(options);
  const { model: model2 = plackett_luce_default } = options;
  const tauSquared = TAU * TAU;
  const processedTeams = teams.map(
    (team) => team.map((p) => __spreadProps(__spreadValues({}, p), {
      sigma: Math.sqrt(p.sigma * p.sigma + tauSquared)
    }))
  );
  const rank = (_c = (_b = options.rank) != null ? _b : (_a = options.score) == null ? void 0 : _a.map((points) => -points)) != null ? _c : range_default(1, teams.length + 1);
  const [orderedTeams, tenet] = unwind(rank, processedTeams);
  const newRatings = model2(orderedTeams, __spreadProps(__spreadValues({}, options), {
    rank: sortBy_default(identity_default, rank)
  }));
  let [reorderedTeams] = unwind(tenet, newRatings);
  if (options.score && options.margin) {
    const scores = options.score;
    const margin = options.margin;
    reorderedTeams = reorderedTeams.map((team, i) => {
      const factor = marginFactor(scores, i, margin);
      return team.map((p, k) => {
        const priorMu = processedTeams[i][k].mu;
        return { mu: priorMu + factor * (p.mu - priorMu), sigma: p.sigma };
      });
    });
  }
  if (TAU && LIMIT_SIGMA) {
    reorderedTeams = reorderedTeams.map(
      (team, i) => team.map((p, j) => __spreadProps(__spreadValues({}, p), {
        sigma: Math.min(p.sigma, teams[i][j].sigma)
      }))
    );
  }
  return reorderedTeams;
};
var rate_default = rate;
function* upperTrianglePairs(n) {
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      yield [i, j];
    }
  }
}
var predictWin = (teams, options = {}) => {
  const { teamRating: teamRating2 } = util_default(options);
  const { BETASQ } = constants_default(options);
  const teamRatings = teamRating2(teams);
  const n = teams.length;
  const denom = n * (n - 1) / 2;
  const wins = reduce_default(
    (acc, [i, j]) => {
      const [muA, sigmaSqA] = teamRatings[i];
      const [muB, sigmaSqB] = teamRatings[j];
      const p = phiMajor((muA - muB) / Math.sqrt(n * BETASQ + sigmaSqA + sigmaSqB));
      acc[i] += p;
      acc[j] += 1 - p;
      return acc;
    },
    new Array(n).fill(0),
    upperTrianglePairs(n)
  );
  return wins.map((w) => w / denom);
};
var predict_win_default = predictWin;
export {
  predict_win_default as predictWin,
  rate_default as rate,
  rating_default as rating
};
/*! Bundled license information:

@stdlib/math-base-assert-is-nan/lib/main.js:
@stdlib/math-base-assert-is-nan/lib/index.js:
@stdlib/math-base-special-floor/lib/main.js:
@stdlib/math-base-special-floor/lib/index.js:
@stdlib/math-base-special-ceil/lib/main.js:
@stdlib/math-base-special-ceil/lib/index.js:
@stdlib/math-base-special-trunc/lib/main.js:
@stdlib/math-base-special-trunc/lib/index.js:
@stdlib/number-ctor/lib/main.js:
@stdlib/number-ctor/lib/index.js:
@stdlib/constants-float64-ninf/lib/index.js:
@stdlib/constants-float64-pinf/lib/index.js:
@stdlib/constants-float64-exponent-bias/lib/index.js:
@stdlib/constants-float64-max-base2-exponent/lib/index.js:
@stdlib/constants-float64-max-base2-exponent-subnormal/lib/index.js:
@stdlib/constants-float64-min-base2-exponent-subnormal/lib/index.js:
@stdlib/math-base-assert-is-infinite/lib/main.js:
@stdlib/math-base-assert-is-infinite/lib/index.js:
@stdlib/utils-define-property/lib/builtin.js:
@stdlib/utils-define-property/lib/polyfill.js:
@stdlib/utils-define-property/lib/index.js:
@stdlib/utils-define-nonenumerable-read-only-property/lib/main.js:
@stdlib/utils-define-nonenumerable-read-only-property/lib/index.js:
@stdlib/assert-has-symbol-support/lib/main.js:
@stdlib/assert-has-symbol-support/lib/index.js:
@stdlib/assert-has-tostringtag-support/lib/main.js:
@stdlib/assert-has-tostringtag-support/lib/index.js:
@stdlib/utils-native-class/lib/tostring.js:
@stdlib/utils-native-class/lib/main.js:
@stdlib/assert-has-own-property/lib/main.js:
@stdlib/assert-has-own-property/lib/index.js:
@stdlib/symbol-ctor/lib/main.js:
@stdlib/symbol-ctor/lib/index.js:
@stdlib/utils-native-class/lib/tostringtag.js:
@stdlib/utils-native-class/lib/polyfill.js:
@stdlib/utils-native-class/lib/index.js:
@stdlib/assert-is-uint32array/lib/main.js:
@stdlib/assert-is-uint32array/lib/index.js:
@stdlib/constants-uint32-max/lib/index.js:
@stdlib/assert-has-uint32array-support/lib/uint32array.js:
@stdlib/assert-has-uint32array-support/lib/main.js:
@stdlib/assert-has-uint32array-support/lib/index.js:
@stdlib/array-uint32/lib/main.js:
@stdlib/array-uint32/lib/polyfill.js:
@stdlib/array-uint32/lib/index.js:
@stdlib/assert-is-float64array/lib/main.js:
@stdlib/assert-is-float64array/lib/index.js:
@stdlib/assert-has-float64array-support/lib/float64array.js:
@stdlib/assert-has-float64array-support/lib/main.js:
@stdlib/assert-has-float64array-support/lib/index.js:
@stdlib/array-float64/lib/main.js:
@stdlib/array-float64/lib/polyfill.js:
@stdlib/array-float64/lib/index.js:
@stdlib/assert-is-uint8array/lib/main.js:
@stdlib/assert-is-uint8array/lib/index.js:
@stdlib/constants-uint8-max/lib/index.js:
@stdlib/assert-has-uint8array-support/lib/uint8array.js:
@stdlib/assert-has-uint8array-support/lib/main.js:
@stdlib/assert-has-uint8array-support/lib/index.js:
@stdlib/array-uint8/lib/main.js:
@stdlib/array-uint8/lib/polyfill.js:
@stdlib/array-uint8/lib/index.js:
@stdlib/assert-is-uint16array/lib/main.js:
@stdlib/assert-is-uint16array/lib/index.js:
@stdlib/constants-uint16-max/lib/index.js:
@stdlib/assert-has-uint16array-support/lib/uint16array.js:
@stdlib/assert-has-uint16array-support/lib/main.js:
@stdlib/assert-has-uint16array-support/lib/index.js:
@stdlib/array-uint16/lib/main.js:
@stdlib/array-uint16/lib/polyfill.js:
@stdlib/array-uint16/lib/index.js:
@stdlib/assert-is-little-endian/lib/ctors.js:
@stdlib/assert-is-little-endian/lib/main.js:
@stdlib/assert-is-little-endian/lib/index.js:
@stdlib/number-float64-base-to-words/lib/indices.js:
@stdlib/number-float64-base-to-words/lib/assign.js:
@stdlib/number-float64-base-to-words/lib/main.js:
@stdlib/number-float64-base-to-words/lib/index.js:
@stdlib/number-float64-base-get-high-word/lib/high.js:
@stdlib/number-float64-base-get-high-word/lib/main.js:
@stdlib/number-float64-base-get-high-word/lib/index.js:
@stdlib/number-float64-base-from-words/lib/indices.js:
@stdlib/number-float64-base-from-words/lib/main.js:
@stdlib/number-float64-base-from-words/lib/index.js:
@stdlib/math-base-special-copysign/lib/main.js:
@stdlib/math-base-special-copysign/lib/index.js:
@stdlib/constants-float64-smallest-normal/lib/index.js:
@stdlib/math-base-special-abs/lib/index.js:
@stdlib/number-float64-base-normalize/lib/assign.js:
@stdlib/number-float64-base-normalize/lib/main.js:
@stdlib/number-float64-base-normalize/lib/index.js:
@stdlib/constants-float64-high-word-exponent-mask/lib/index.js:
@stdlib/number-float64-base-exponent/lib/main.js:
@stdlib/number-float64-base-exponent/lib/index.js:
@stdlib/math-base-special-ldexp/lib/main.js:
@stdlib/math-base-special-ldexp/lib/index.js:
@stdlib/math-base-special-exp/lib/index.js:
@stdlib/number-float64-base-set-low-word/lib/low.js:
@stdlib/number-float64-base-set-low-word/lib/main.js:
@stdlib/number-float64-base-set-low-word/lib/index.js:
@stdlib/math-base-special-erf/lib/index.js:
@stdlib/math-base-special-sqrt/lib/main.js:
@stdlib/math-base-special-sqrt/lib/index.js:
@stdlib/number-float64-base-set-high-word/lib/high.js:
@stdlib/number-float64-base-set-high-word/lib/main.js:
@stdlib/number-float64-base-set-high-word/lib/index.js:
@stdlib/math-base-special-ln/lib/index.js:
@stdlib/math-base-special-erfinv/lib/index.js:
@stdlib/stats-base-dists-normal-quantile/lib/main.js:
@stdlib/utils-constant-function/lib/main.js:
@stdlib/utils-constant-function/lib/index.js:
@stdlib/stats-base-dists-degenerate-quantile/lib/main.js:
@stdlib/stats-base-dists-degenerate-quantile/lib/factory.js:
@stdlib/stats-base-dists-degenerate-quantile/lib/index.js:
@stdlib/stats-base-dists-normal-quantile/lib/factory.js:
@stdlib/stats-base-dists-normal-quantile/lib/index.js:
  (**
  * @license Apache-2.0
  *
  * Copyright (c) 2018 The Stdlib Authors.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *    http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *)

@stdlib/constants-float64-high-word-sign-mask/lib/index.js:
@stdlib/constants-float64-high-word-abs-mask/lib/index.js:
@stdlib/string-base-format-interpolate/lib/is_number.js:
@stdlib/string-base-format-interpolate/lib/zero_pad.js:
@stdlib/string-base-format-interpolate/lib/format_integer.js:
@stdlib/string-base-format-interpolate/lib/is_string.js:
@stdlib/string-base-format-interpolate/lib/format_double.js:
@stdlib/string-base-format-interpolate/lib/space_pad.js:
@stdlib/string-base-format-interpolate/lib/main.js:
@stdlib/string-base-format-interpolate/lib/index.js:
@stdlib/string-base-format-tokenize/lib/main.js:
@stdlib/string-base-format-tokenize/lib/index.js:
@stdlib/string-format/lib/is_string.js:
@stdlib/string-format/lib/main.js:
@stdlib/string-format/lib/index.js:
@stdlib/math-base-special-exp/lib/polyval_p.js:
@stdlib/math-base-special-erf/lib/polyval_pp.js:
@stdlib/math-base-special-erf/lib/polyval_qq.js:
@stdlib/math-base-special-erf/lib/polyval_pa.js:
@stdlib/math-base-special-erf/lib/polyval_qa.js:
@stdlib/math-base-special-erf/lib/polyval_ra.js:
@stdlib/math-base-special-erf/lib/polyval_sa.js:
@stdlib/math-base-special-erf/lib/polyval_rb.js:
@stdlib/math-base-special-erf/lib/polyval_sb.js:
@stdlib/math-base-special-ln/lib/polyval_p.js:
@stdlib/math-base-special-ln/lib/polyval_q.js:
@stdlib/math-base-special-erfinv/lib/rational_p1q1.js:
@stdlib/math-base-special-erfinv/lib/rational_p2q2.js:
@stdlib/math-base-special-erfinv/lib/rational_p3q3.js:
@stdlib/math-base-special-erfinv/lib/rational_p4q4.js:
@stdlib/math-base-special-erfinv/lib/rational_p5q5.js:
  (**
  * @license Apache-2.0
  *
  * Copyright (c) 2022 The Stdlib Authors.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *    http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *)

@stdlib/utils-define-property/lib/define_property.js:
@stdlib/utils-define-property/lib/has_define_property_support.js:
@stdlib/math-base-special-abs/lib/main.js:
  (**
  * @license Apache-2.0
  *
  * Copyright (c) 2021 The Stdlib Authors.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *    http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *)

@stdlib/math-base-special-exp/lib/expmulti.js:
@stdlib/math-base-special-exp/lib/main.js:
  (**
  * @license Apache-2.0
  *
  * Copyright (c) 2018 The Stdlib Authors.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *    http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *
  *
  * ## Notice
  *
  * The following copyrights, licenses, and long comment were part of the original implementation available as part of [Go]{@link https://github.com/golang/go/blob/cb07765045aed5104a3df31507564ac99e6ddce8/src/math/exp.go}, which in turn was based on an implementation available as part of [FreeBSD]{@link https://svnweb.freebsd.org/base/release/9.3.0/lib/msun/src/e_exp.c}. The implementation follows the original, but has been modified for JavaScript.
  *
  * ```text
  * Copyright (c) 2009 The Go Authors. All rights reserved.
  *
  * Redistribution and use in source and binary forms, with or without
  * modification, are permitted provided that the following conditions are
  * met:
  *
  *    * Redistributions of source code must retain the above copyright
  * notice, this list of conditions and the following disclaimer.
  *    * Redistributions in binary form must reproduce the above
  * copyright notice, this list of conditions and the following disclaimer
  * in the documentation and/or other materials provided with the
  * distribution.
  *    * Neither the name of Google Inc. nor the names of its
  * contributors may be used to endorse or promote products derived from
  * this software without specific prior written permission.
  *
  * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
  * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
  * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
  * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
  * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
  * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
  * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
  * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
  * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
  * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  * ```
  *
  * ```text
  * Copyright (C) 2004 by Sun Microsystems, Inc. All rights reserved.
  *
  * Developed at SunPro, a Sun Microsystems, Inc. business.
  * Permission to use, copy, modify, and distribute this
  * software is freely granted, provided that this notice
  * is preserved.
  * ```
  *)

@stdlib/math-base-special-erf/lib/main.js:
  (**
  * @license Apache-2.0
  *
  * Copyright (c) 2018 The Stdlib Authors.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *    http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *
  *
  * ## Notice
  *
  * The following copyright, license, and long comment were part of the original implementation available as part of [FreeBSD]{@link https://svnweb.freebsd.org/base/release/9.3.0/lib/msun/src/s_erf.c}. The implementation follows the original, but has been modified for JavaScript.
  *
  * ```text
  * Copyright (C) 1993 by Sun Microsystems, Inc. All rights reserved.
  *
  * Developed at SunPro, a Sun Microsystems, Inc. business.
  * Permission to use, copy, modify, and distribute this
  * software is freely granted, provided that this notice
  * is preserved.
  * ```
  *)

@stdlib/math-base-special-ln/lib/main.js:
  (**
  * @license Apache-2.0
  *
  * Copyright (c) 2018 The Stdlib Authors.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *    http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *
  *
  * ## Notice
  *
  * The following copyright and license were part of the original implementation available as part of [FreeBSD]{@link https://svnweb.freebsd.org/base/release/9.3.0/lib/msun/src/e_log.c}. The implementation follows the original, but has been modified for JavaScript.
  *
  * ```text
  * Copyright (C) 1993 by Sun Microsystems, Inc. All rights reserved.
  *
  * Developed at SunPro, a Sun Microsystems, Inc. business.
  * Permission to use, copy, modify, and distribute this
  * software is freely granted, provided that this notice
  * is preserved.
  * ```
  *)

@stdlib/math-base-special-erfinv/lib/main.js:
  (**
  * @license Apache-2.0
  *
  * Copyright (c) 2018 The Stdlib Authors.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *    http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *
  *
  * ## Notice
  *
  * The original C++ code and copyright notice are from the [Boost library]{@link http://www.boost.org/doc/libs/1_48_0/boost/math/special_functions/detail/erf_inv.hpp}. This implementation follows the original, but has been modified for JavaScript.
  *
  * ```text
  * (C) Copyright John Maddock 2006.
  *
  * Use, modification and distribution are subject to the
  * Boost Software License, Version 1.0. (See accompanying file
  * LICENSE or copy at http://www.boost.org/LICENSE_1_0.txt)
  * ```
  *)
*/
