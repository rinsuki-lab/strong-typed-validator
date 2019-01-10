export type Validator<T> = (input: any) => T

export interface NumberValidatorOptions {
    onlyInt?: "floor" | "ceil" | "round" | "error"
    min?: number
    max?: number
}

export interface StringValidatorOptions {
    min?: number
    max?: number
    regexp?: RegExp
}

export interface ArrayValidatorOptions {
    min?: number
    max?: number
}

export interface ObjectValidatorOptions {
    unknownProperties?: "accept" | "only-remove" | "error"
}

export const validator = {
    number(options: NumberValidatorOptions = {}): Validator<number> {
        return input => {
            if (input == null) throw new Error("input is required.")
            var value = typeof input === "number" ? input : typeof input === "string" ? parseFloat(input) : undefined
            if (value == null) throw new Error("input is not number.")
            if (options.onlyInt != null) {
                if (Number.isInteger(value) === false) {
                    if (options.onlyInt === "error") {
                        throw new Error("input is only accepted integer.")
                    } else {
                        value = Math[options.onlyInt](value)
                    }
                }
            }
            if (options.min != null && value < options.min) throw new Error("input is smaller.")
            if (options.max != null && value > options.max) throw new Error("input is bigger.")
            return value
        }
    },
    string(options: StringValidatorOptions = {}): Validator<string> {
        return input => {
            if (input == null) throw new Error("input is required.")
            const value = typeof input === "string" ? input : undefined
            if (value == null) throw new Error("input is not string.")
            if (options.min != null && value.length < options.min) throw new Error("input is too short.")
            if (options.max != null && value.length > options.max) throw new Error("input is too long.")
            if (options.regexp != null && !options.regexp.test(value)) throw new Error("input format is invalid.")
            return value
        }
    },
    bool(isLeniency = false, optionalAccept = false): Validator<boolean> {
        return input => {
            if (input == null) {
                if (optionalAccept) {
                    return false
                } else {
                    throw new Error("input is required.")
                }
            }
            if (typeof input === "boolean") return input
            if (isLeniency) {
                if (typeof input === "number") return input !== 0
                if (typeof input === "string") {
                    if (input.length === 0 || input === "false" || input === "0") return false
                }
                return true
            } else {
                throw new Error("input is not boolean.")
            }
        }
    },
    or<T1, T2>(exp1: Validator<T1>, exp2: Validator<T2>): Validator<T1 | T2> {
        return input => {
            try {
                return exp1(input)
            } catch(e) {
                return exp2(input)
            }
        }
    },
    obj<T>(obj: {[K in keyof T]: Validator<T[K]>}, options: ObjectValidatorOptions = {}): Validator<T> {
        return input => {
            if (input == null) throw new Error("input is required.")
            if (typeof input !== "object") throw new Error("input is not object.")
            for (const name of Object.keys(input)) {
                if (name in obj) {
                    input[name] = (obj as {[key: string]: Validator<any>})[name](input[name])
                } else {
                    switch (options.unknownProperties) {
                    case "error":
                        throw new Error("please don't include unknown properties.")
                    case "only-remove":
                        delete input[name]
                    case "accept":
                    default:
                        break
                    }
                }
            }
            return input
        }
    },
    array<T>(exp: Validator<T>, options: ArrayValidatorOptions = {}): Validator<T[]> {
        return input => {
            if (input == null) throw new Error("input is required.")
            if (!Array.isArray(input)) throw new Error("input is not array.")
            if (options.max != null && input.length > options.max) throw new Error("input is bigger.")
            if (options.min != null && input.length < options.min) throw new Error("input is smaller.")
            return input.map(exp)
        }
    },
    optional<T, D = undefined>(exp: Validator<T>, defaultValue?: D): Validator<T | D> {
        return input => {
            if (input == null) {
                return (defaultValue as unknown) as D
            }
            return exp(input)
        }
    },
}