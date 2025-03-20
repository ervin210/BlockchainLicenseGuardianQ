// Type declarations for path aliases
declare module '@/components/ui/*' {
  const component: any;
  export default component;
  export * from '*';
}

declare module '@/pages/*' {
  const component: any;
  export default component;
}

declare module '@/lib/*' {
  const module: any;
  export default module;
  export * from '*';
}

declare module '@/hooks/*' {
  const hook: any;
  export default hook;
  export * from '*';
}

// Type declarations for ethers
declare module 'ethers/dist/ethers.esm.min.js' {
  export * from 'ethers';
}