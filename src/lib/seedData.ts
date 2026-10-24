import { SaleOrder } from '../types';
import { FIBER_VOLT_DEALS } from './fiberVoltSales';
import {
  NON_VOLT_USERS,
  NON_VOLT_BLITZES,
  NON_VOLT_JOIN_REQUESTS,
  NON_VOLT_AVAILABILITY,
  NON_VOLT_SALES,
  NON_VOLT_COURSES,
  NON_VOLT_NOTIFICATIONS,
  NON_VOLT_MESSAGES,
  NON_VOLT_DATA,
} from '../data/nonVoltData';

export {
  NON_VOLT_USERS,
  NON_VOLT_BLITZES,
  NON_VOLT_JOIN_REQUESTS,
  NON_VOLT_AVAILABILITY,
  NON_VOLT_SALES,
  NON_VOLT_COURSES,
  NON_VOLT_NOTIFICATIONS,
  NON_VOLT_MESSAGES,
  NON_VOLT_DATA,
};

// Application Seed Constants (Unified across Non-Volt and Volt sources)
export const INITIAL_USERS = NON_VOLT_USERS;
export const INITIAL_BLITZES = NON_VOLT_BLITZES;
export const INITIAL_JOIN_REQUESTS = NON_VOLT_JOIN_REQUESTS;
export const INITIAL_AVAILABILITY = NON_VOLT_AVAILABILITY;

/**
 * Combined sales order pipeline:
 * - 99 Carrier-verified Fiber Volt (MobileReach) deals (Isaac Garza & Dwayne Williams)
 * - 11 Regional Non-Volt ISP field sales orders (Jordan Hayes, Elena Rivera, Malik Johnson, etc.)
 */
export const INITIAL_SALES: SaleOrder[] = [...FIBER_VOLT_DEALS, ...NON_VOLT_SALES];

export const INITIAL_COURSES = NON_VOLT_COURSES;
export const INITIAL_NOTIFICATIONS = NON_VOLT_NOTIFICATIONS;
export const INITIAL_MESSAGES = NON_VOLT_MESSAGES;
