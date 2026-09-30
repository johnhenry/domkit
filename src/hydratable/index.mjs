const HYDRATED = Symbol("hydrated");
const TEARDOWN = Symbol("hydratable.teardown");

/**
 * @param {(this: object, opts: { finalizer: (fn: Function) => void, dehydrator: (fn: Function) => void }) => Promise<void>} hydrate
 * @param {string} [name] Method name for the hydrate operation.
 * @param {string} [dehydrateName] Method name for its counterpart. Defaults to `de${name}`.
 */
const Hydratable = (hydrate, name = "hydrate", dehydrateName = `de${name}`) => {
  const PROTOTYPE = {
    async [name]() {
      // should not be called directly on prototype object,
      // but rather from inherritor
      if (this.hasOwnProperty(name)) {
        throw new Error(`${name}(...) must not be called from prototype`);
      }
      // return object if already hydrated
      if (this[HYDRATED]) {
        return this;
      }
      // finalize may be set during hydration; dehydrator registers this
      // hydration's own teardown, consumed by [dehydrateName]() below
      let finalize;
      let teardown;
      await hydrate.call(this, {
        finalizer: (func) => {
          finalize = func;
        },
        dehydrator: (func) => {
          teardown = func;
        },
      });
      // set HYDRATED flag -- configurable so [dehydrateName]() can clear it;
      // the original had this non-configurable, which made hydration a
      // permanent, one-way transition with no way back short of building a
      // whole new object from scratch
      Object.defineProperty(this, HYDRATED, {
        configurable: true,
        value: true,
        writable: false,
      });
      if (typeof teardown === "function") {
        Object.defineProperty(this, TEARDOWN, {
          configurable: true,
          value: teardown,
          writable: false,
        });
      }
      // apply finalize after hydration
      if (typeof finalize === "function") {
        await finalize.call(this, this);
      }
      // return hydrated object
      return this;
    },
    async [dehydrateName]() {
      if (this.hasOwnProperty(dehydrateName)) {
        throw new Error(`${dehydrateName}(...) must not be called from prototype`);
      }
      // nothing to undo if never hydrated (or already dehydrated)
      if (!this[HYDRATED]) {
        return this;
      }
      if (this.hasOwnProperty(TEARDOWN)) {
        await this[TEARDOWN].call(this, this);
        delete this[TEARDOWN];
      }
      delete this[HYDRATED];
      return this;
    },
  };
  return PROTOTYPE;
};
export default Hydratable;
export { HYDRATED, TEARDOWN };
