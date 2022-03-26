declare interface ConfigData {}

declare type ActionType = string;
declare type ObservationType = string;
declare type PredictFunction = (observation: any) => ActionType;

//ob,act->value
declare type ValueFunction = (ob: ObservationType, act: ActionType) => number;
declare type StrategyTable = {
  [observ: string]: {
    [action: string]: number;
  };
};
