export type Fn = () => void;
export type ContextAwareFn = (context: Context) => void;

export interface Context {
  name: string;
}

interface FullContext {
  name: string;
  beforeEachFns: ContextAwareFn[];
  afterEachFns: ContextAwareFn[];
}

const contextStack: FullContext[] = [];

export function describe(name: string, fn: Fn): void {
  contextStack.push({
    name,
    beforeEachFns: [],
    afterEachFns: [],
  });
  fn();
  contextStack.pop();
}

const apply = ({ name }: Record<"name", string>) =>
  (fn: ContextAwareFn) => fn({ name });

function joinNames(...names: string[]): string {
  return names.join(" → ");
}

export function it(name: string, fn: Fn): void {
  const context: FullContext = getEffectiveContext("it");
  const jointNames = joinNames(context.name, name);
  context.beforeEachFns.forEach(apply({ name: jointNames }));
  Deno.test(jointNames, fn);
  context.afterEachFns.forEach(apply({ name: jointNames }));
}

function getCurrentContext(caller: string): FullContext | never {
  const context = contextStack.at(contextStack.length - 1);
  if (typeof context === "undefined") {
    throw new Error(`You must call ${caller} inside a describe block.`);
  }
  return context;
}

function getEffectiveContext(caller: string): FullContext | never {
  if (contextStack.length === 0) {
    throw new Error(`You must call ${caller} inside a describe block.`);
  }
  return contextStack.reduce((acc, curr) => ({
    name: joinNames(acc.name, curr.name),
    beforeEachFns: [...acc.beforeEachFns, ...curr.beforeEachFns],
    afterEachFns: [...acc.afterEachFns, ...curr.afterEachFns],
  }));
}

export function beforeEach(fn: ContextAwareFn): void {
  const context: FullContext = getCurrentContext("beforeEach");
  context.beforeEachFns.push(fn);
}

export function afterEach(fn: ContextAwareFn): void {
  const context: FullContext = getCurrentContext("afterEach");
  context.afterEachFns.push(fn);
}
